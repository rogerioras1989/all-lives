import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import {
  getTenantContext,
  requireCampaignOwnership,
  requireTenantAnalytics,
  requireTenantManagement,
  tenantError,
} from "@/lib/tenant";

export const dynamic = "force-dynamic";

const client = new Anthropic();

const AI_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos entre análises por campanha/scope

// C-3: sanitiza strings de usuário antes de interpolar no prompt IA
function sanitizeForPrompt(str: string): string {
  return str
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "") // remove control chars exceto \t \n \r
    .replace(/\n{3,}/g, "\n\n")                          // colapsa múltiplas quebras
    .slice(0, 200);                                       // limita tamanho
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getTenantContext(req);
    await requireCampaignOwnership(id, ctx);
    requireTenantManagement(ctx);

    const { scope = "CAMPAIGN", sector } = await req.json();

    // BUG-14: cooldown filtrado por scope + sector (para não bloquear setores distintos)
    const lastAnalysis = await prisma.aiAnalysis.findFirst({
      where: {
        campaignId: id,
        scope: scope as "CAMPAIGN" | "SECTOR" | "INDIVIDUAL",
        // quando scope=SECTOR, filtrar pelo setor específico para cooldowns independentes
        ...(scope === "SECTOR" && sector ? { sector } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (lastAnalysis) {
      const elapsed = Date.now() - lastAnalysis.createdAt.getTime();
      if (elapsed < AI_COOLDOWN_MS) {
        const waitSecs = Math.ceil((AI_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          { error: `Aguarde ${waitSecs}s antes de gerar nova análise para este escopo.` },
          { status: 429 }
        );
      }
    }

    const responseWhere = {
      campaignId: id,
      ...(scope === "SECTOR" && sector ? { sector } : {}),
    };

    const [campaign, responseCount, topicGroups, riskGroups] = await Promise.all([
      prisma.campaign.findUnique({
        where: { id },
        select: { id: true, title: true },
      }),
      prisma.response.count({ where: responseWhere }),
      prisma.topicScore.groupBy({
        by: ["topicId", "topicName"],
        where: { response: responseWhere },
        _avg: { score: true },
        _count: { id: true },
      }),
      prisma.response.groupBy({
        by: ["riskLevel"],
        where: { ...responseWhere, riskLevel: { not: null } },
        _count: { id: true },
      }),
    ]);
    if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (responseCount === 0) {
      return NextResponse.json({ error: "Sem respostas suficientes" }, { status: 400 });
    }

    const topicSummary = topicGroups.map((group) => ({
      topic: group.topicName,
      avgScore: (group._avg.score ?? 0).toFixed(2),
      count: group._count.id,
    }));

    const riskCounts = riskGroups.reduce(
      (acc, group) => {
        if (group.riskLevel) acc[group.riskLevel] = group._count.id;
        return acc;
      },
      { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 } as Record<string, number>
    );

    // C-3: sanitizar todos os valores controlados pelo usuário antes de interpolar
    const safeTitle = sanitizeForPrompt(campaign.title);
    const safeSector = sector ? sanitizeForPrompt(sector) : "";
    const safeTopicSummary = topicSummary.map((t) => ({
      ...t,
      topic: sanitizeForPrompt(t.topic),
    }));

    const contextStr = scope === "SECTOR"
      ? `Setor: <sector>${safeSector}</sector> | Respostas: ${responseCount}`
      : `Campanha: <title>${safeTitle}</title> | Total de respostas: ${responseCount}`;

    const prompt = `Você é um especialista em saúde ocupacional e riscos psicossociais conforme a NR-01 brasileira.

Analise os dados abaixo e forneça:
1. **Diagnóstico geral** (2-3 parágrafos)
2. **Principais riscos identificados** (lista com justificativa)
3. **Plano de ação recomendado** (5 ações práticas priorizadas)
4. **Alertas urgentes** (se houver scores críticos)

Contexto: ${contextStr}
Distribuição de risco: ${JSON.stringify(riskCounts)}

Scores por tópico:
${safeTopicSummary.map((t) => `- ${t.topic}: média ${t.avgScore} (${t.count} avaliações)`).join("\n")}

Responda em português brasileiro, de forma objetiva e prática para o departamento de RH.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const result = message.content[0].type === "text" ? message.content[0].text : "";
    const tokens = message.usage.input_tokens + message.usage.output_tokens;

    const analysis = await prisma.aiAnalysis.create({
      data: {
        campaignId: id,
        scope: scope as "CAMPAIGN" | "SECTOR" | "INDIVIDUAL",
        prompt,
        result,
        model: "claude-sonnet-4-6",
        tokens,
      },
    });

    // A-7: não retornar result bruto — analysis já contém o campo result
    return NextResponse.json({ analysis });
  } catch (err) {
    const { error, status } = tenantError(err);
    if (status !== 500) return NextResponse.json({ error }, { status });
    console.error("[ai-analysis]", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Erro na análise" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getTenantContext(req);
    await requireCampaignOwnership(id, ctx);
    requireTenantAnalytics(ctx);

    const analyses = await prisma.aiAnalysis.findMany({
      where: { campaignId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return NextResponse.json({ analyses });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

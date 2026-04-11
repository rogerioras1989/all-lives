import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateTopicScore, getRiskLevel, TOPICS } from "@/data/questionnaire";
import { invalidateCampaignResults } from "@/lib/campaign-cache";
import crypto from "crypto";

const VALID_TOPIC_IDS = new Set(TOPICS.map((t) => t.id));
const MAX_COMMENT_LENGTH = 2000;
const EXPECTED_ANSWER_KEYS = new Set(
  TOPICS.flatMap((topic) => topic.questions.map((question) => `${topic.id}-${question.id}`))
);
const MAX_ANSWERS = EXPECTED_ANSWER_KEYS.size; // dinâmico baseado no questionário atual
const RESPONSE_WINDOW_MS = 60 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 3;
const submissionStore = new Map<string, { count: number; windowStart: number }>();

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const cutoff = Date.now() - RESPONSE_WINDOW_MS * 2;
    for (const [key, entry] of submissionStore.entries()) {
      if (entry.windowStart < cutoff) submissionStore.delete(key);
    }
  }, 10 * 60 * 1000);
}

// M-1: redação de PII em comentários anônimos (CPF, e-mail, telefone)
function redactPii(text: string): string {
  return text
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF]")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[EMAIL]")
    .replace(/\b\d{2}[\s.-]?\d{4,5}[\s.-]?\d{4}\b/g, "[TELEFONE]");
}

function getRequesterIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function hashIp(ip: string): string {
  const secret = process.env.CPF_HMAC_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error("MISSING_RATE_LIMIT_SECRET");
  return crypto.createHmac("sha256", secret).update(ip).digest("hex");
}

function checkSubmissionRateLimit(key: string): boolean {
  const now = Date.now();
  const current = submissionStore.get(key);
  if (!current || now - current.windowStart > RESPONSE_WINDOW_MS) {
    submissionStore.set(key, { count: 1, windowStart: now });
    return true;
  }
  current.count += 1;
  return current.count <= MAX_SUBMISSIONS_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { campaignId, sector, jobTitle, answers, comments } = body;
    const ipHash = hashIp(getRequesterIp(req));

    if (!campaignId || !sector || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // BUG-8: validação de setor removida — setores são configurados por empresa, não hardcoded
    if (typeof sector !== "string" || sector.trim().length === 0) {
      return NextResponse.json({ error: "Setor inválido" }, { status: 400 });
    }

    // fix #6 — verificar que campanha existe e está ATIVA
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }
    if (campaign.status !== "ACTIVE") {
      return NextResponse.json({ error: "Campanha não está ativa" }, { status: 400 });
    }

    // fix #20 — limitar quantidade de respostas
    if (answers.length > MAX_ANSWERS) {
      return NextResponse.json({ error: "Número de respostas excede o limite" }, { status: 400 });
    }

    if (answers.length !== EXPECTED_ANSWER_KEYS.size) {
      return NextResponse.json({ error: "Questionário incompleto ou inconsistente" }, { status: 400 });
    }

    // fix #5 + #20 — validar topicId, questionId e value de cada resposta
    const receivedKeys = new Set<string>();
    for (const a of answers) {
      if (
        typeof a.topicId !== "number" ||
        typeof a.questionId !== "number" ||
        typeof a.value !== "number"
      ) {
        return NextResponse.json({ error: "Formato de resposta inválido" }, { status: 400 });
      }
      if (!VALID_TOPIC_IDS.has(a.topicId)) {
        return NextResponse.json({ error: `topicId inválido: ${a.topicId}` }, { status: 400 });
      }
      const answerKey = `${a.topicId}-${a.questionId}`;
      if (!EXPECTED_ANSWER_KEYS.has(answerKey) || receivedKeys.has(answerKey)) {
        return NextResponse.json({ error: "Perguntas duplicadas ou fora do questionário esperado" }, { status: 400 });
      }
      receivedKeys.add(answerKey);
      if (!Number.isInteger(a.value) || a.value < 0 || a.value > 4) {
        return NextResponse.json({ error: "Valor de resposta deve ser inteiro entre 0 e 4" }, { status: 400 });
      }
    }

    if (!checkSubmissionRateLimit(`${campaignId}:${ipHash}`)) {
      return NextResponse.json({ error: "Muitas respostas enviadas a partir desta origem. Tente novamente mais tarde." }, { status: 429 });
    }

    const recentSubmissions = await prisma.response.count({
      where: {
        campaignId,
        ipHash,
        createdAt: { gte: new Date(Date.now() - RESPONSE_WINDOW_MS) },
      },
    });
    if (recentSubmissions >= MAX_SUBMISSIONS_PER_WINDOW) {
      return NextResponse.json({ error: "Limite temporário de respostas atingido para esta origem." }, { status: 429 });
    }

    const topicScores = TOPICS.map((topic) => {
      const topicAnswers = answers.filter(
        (a: { topicId: number; questionId: number; value: number }) =>
          a.topicId === topic.id
      );
      const score = calculateTopicScore(topic.id, topicAnswers);
      const riskLevel = getRiskLevel(score);
      return { topicId: topic.id, topicName: topic.title, score, riskLevel };
    });

    const totalScore =
      topicScores.reduce((sum, ts) => sum + ts.score, 0) / topicScores.length;
    const overallRisk = getRiskLevel(totalScore);

    // Build comments array — fix #16: limitar tamanho e validar topicId
    const commentRecords: { topicId: number; text: string; isAnonymous: boolean }[] = [];
    if (comments && typeof comments === "object") {
      for (const [topicId, text] of Object.entries(comments)) {
        const tid = Number(topicId);
        if (!VALID_TOPIC_IDS.has(tid)) continue;
        if (typeof text === "string" && text.trim()) {
          commentRecords.push({
            topicId: tid,
            text: redactPii(text.trim().slice(0, MAX_COMMENT_LENGTH)), // M-1: redação de PII
            isAnonymous: true,
          });
        }
      }
    }

    // C-6: re-verificar status da campanha dentro da transação para evitar race condition
    const response = await prisma.$transaction(async (tx) => {
      const activeCampaign = await tx.campaign.findUnique({
        where: { id: campaignId, status: "ACTIVE" },
        select: { id: true },
      });
      if (!activeCampaign) throw new Error("CAMPAIGN_INACTIVE");

      return tx.response.create({
        data: {
          campaignId,
          sector,
          jobTitle,
          totalScore,
          riskLevel: overallRisk,
          ipHash,
          answers: {
            create: answers.map(
              (a: { topicId: number; questionId: number; value: number }) => ({
                topicId: a.topicId,
                questionId: a.questionId,
                value: a.value,
              })
            ),
          },
          scores: { create: topicScores },
          comments: commentRecords.length > 0
            ? { create: commentRecords }
            : undefined,
        },
        include: { scores: true },
      });
    });

    // Invalida cache de resultados da campanha — garante que dashboards
    // reflitam a nova resposta sem stale.
    invalidateCampaignResults(campaignId);

    return NextResponse.json({
      success: true,
      responseId: response.id,
      scores: topicScores,
      totalScore,
      overallRisk,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CAMPAIGN_INACTIVE") {
      return NextResponse.json({ error: "Campanha não está ativa" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "MISSING_RATE_LIMIT_SECRET") {
      return NextResponse.json({ error: "Configuração de segurança ausente" }, { status: 500 });
    }
    console.error("[responses]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

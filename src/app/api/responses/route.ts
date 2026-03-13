import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateTopicScore, getRiskLevel, TOPICS, SECTORS } from "@/data/questionnaire";

const VALID_TOPIC_IDS = new Set(TOPICS.map((t) => t.id));
const MAX_ANSWERS = TOPICS.length * 10; // 90
const MAX_COMMENT_LENGTH = 2000;

// M-1: redação de PII em comentários anônimos (CPF, e-mail, telefone)
function redactPii(text: string): string {
  return text
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF]")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[EMAIL]")
    .replace(/\b\d{2}[\s.-]?\d{4,5}[\s.-]?\d{4}\b/g, "[TELEFONE]");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { campaignId, sector, jobTitle, answers, comments } = body;

    if (!campaignId || !sector || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // fix #13 — validate sector against known values
    if (!SECTORS.includes(sector)) {
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

    // fix #5 + #20 — validar topicId, questionId e value de cada resposta
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
      if (!Number.isInteger(a.value) || a.value < 0 || a.value > 4) {
        return NextResponse.json({ error: "Valor de resposta deve ser inteiro entre 0 e 4" }, { status: 400 });
      }
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
    console.error("[responses]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

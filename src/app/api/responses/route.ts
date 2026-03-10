import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateTopicScore, getRiskLevel, TOPICS, SECTORS } from "@/data/questionnaire";

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

    // Build comments array — only non-empty entries
    const commentRecords: { topicId: number; text: string; isAnonymous: boolean }[] = [];
    if (comments && typeof comments === "object") {
      for (const [topicId, text] of Object.entries(comments)) {
        if (typeof text === "string" && text.trim()) {
          commentRecords.push({
            topicId: Number(topicId),
            text: text.trim(),
            isAnonymous: true,
          });
        }
      }
    }

    const response = await prisma.response.create({
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

    return NextResponse.json({
      success: true,
      responseId: response.id,
      scores: topicScores,
      totalScore,
      overallRisk,
    });
  } catch (error) {
    console.error("[responses]", error instanceof Error ? error.message : "unknown"); // fix #19
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

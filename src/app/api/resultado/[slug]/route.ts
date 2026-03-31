import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PUBLIC_RESULTS_ENABLED = process.env.ENABLE_PUBLIC_RESULTS === "true";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    if (!PUBLIC_RESULTS_ENABLED) {
      return NextResponse.json({ error: "Resultados públicos desabilitados" }, { status: 403 });
    }
    const { slug } = await params;
    const campaign = await prisma.campaign.findFirst({
      where: { slug, status: { in: ["ACTIVE", "CLOSED"] } },
      select: {
        id: true, title: true, status: true, startDate: true, endDate: true,
        company: { select: { name: true, helpUrl: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campanha não encontrada ou não disponível" }, { status: 404 });
    }

    const totalResponses = await prisma.response.count({ where: { campaignId: campaign.id } });

    if (totalResponses === 0) {
      return NextResponse.json({ campaign, totalResponses: 0, overallAverage: 0, topicAverages: [], sectorSummary: [] });
    }

    const topicGroups = await prisma.topicScore.groupBy({
      by: ["topicId", "topicName"],
      where: { response: { campaignId: campaign.id } },
      _avg: { score: true },
    });

    const topicAverages = topicGroups
      .map((g) => ({ topicId: g.topicId, topicName: g.topicName, averageScore: Math.round(g._avg.score ?? 0) }))
      .sort((a, b) => a.topicId - b.topicId);

    const sectorGroups = await prisma.response.groupBy({
      by: ["sector"],
      where: { campaignId: campaign.id },
      _avg: { totalScore: true },
      _count: { totalScore: true },
    });

    const sectorSummary = sectorGroups.map((g) => ({
      sector: g.sector,
      count: g._count.totalScore,
      averageScore: Math.round(g._avg.totalScore ?? 0),
    }));

    const overallAgg = await prisma.response.aggregate({
      where: { campaignId: campaign.id },
      _avg: { totalScore: true },
    });

    return NextResponse.json({
      campaign,
      totalResponses,
      overallAverage: Math.round(overallAgg._avg.totalScore ?? 0),
      topicAverages,
      sectorSummary,
    });
  } catch (err) {
    console.error("[Public Results Error]", err);
    return NextResponse.json({ error: "Erro ao buscar resultados" }, { status: 500 });
  }
}

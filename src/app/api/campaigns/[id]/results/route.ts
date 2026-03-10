import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, requireCampaignOwnership, tenantError } from "@/lib/tenant";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getTenantContext(req);
    await requireCampaignOwnership(id, ctx);

    const { searchParams } = new URL(req.url);
    const sector = searchParams.get("sector");

    const responses = await prisma.response.findMany({
      where: { campaignId: id, ...(sector ? { sector } : {}) },
      include: { scores: true },
    });

    if (responses.length === 0) {
      return NextResponse.json({
        totalResponses: 0,
        overallAverage: 0,
        topicAverages: [],
        sectorSummary: [],
      });
    }

    const topicMap: Record<number, { topicId: number; topicName: string; scores: number[] }> = {};
    for (const response of responses) {
      for (const score of response.scores) {
        if (!topicMap[score.topicId]) {
          topicMap[score.topicId] = { topicId: score.topicId, topicName: score.topicName, scores: [] };
        }
        topicMap[score.topicId].scores.push(score.score);
      }
    }

    const topicAverages = Object.values(topicMap).map((t) => ({
      topicId: t.topicId,
      topicName: t.topicName,
      averageScore: t.scores.reduce((a, b) => a + b, 0) / t.scores.length,
      riskDistribution: {
        LOW: t.scores.filter((s) => s <= 25).length,
        MEDIUM: t.scores.filter((s) => s > 25 && s <= 50).length,
        HIGH: t.scores.filter((s) => s > 50 && s <= 75).length,
        CRITICAL: t.scores.filter((s) => s > 75).length,
      },
    }));

    const sectorMap: Record<string, { count: number; totalScore: number }> = {};
    for (const r of responses) {
      if (!sectorMap[r.sector]) sectorMap[r.sector] = { count: 0, totalScore: 0 };
      sectorMap[r.sector].count++;
      sectorMap[r.sector].totalScore += r.totalScore ?? 0;
    }

    const sectorSummary = Object.entries(sectorMap).map(([s, data]) => ({
      sector: s,
      count: data.count,
      averageScore: data.totalScore / data.count,
    }));

    const overallAverage =
      responses.reduce((sum: number, r: { totalScore: number | null }) => sum + (r.totalScore ?? 0), 0) /
      responses.length;

    return NextResponse.json({ totalResponses: responses.length, overallAverage, topicAverages, sectorSummary });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

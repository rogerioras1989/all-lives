import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, requireCampaignOwnership, tenantError } from "@/lib/tenant";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getTenantContext(req);
    await requireCampaignOwnership(id, ctx);

    const responses = await prisma.response.findMany({
      where: { campaignId: id },
      include: { scores: true },
    });

    if (responses.length === 0) {
      return NextResponse.json({ error: "Sem respostas" }, { status: 400 });
    }

    const topicMap: Record<number, { name: string; scores: number[] }> = {};
    for (const r of responses) {
      for (const s of r.scores) {
        if (!topicMap[s.topicId]) topicMap[s.topicId] = { name: s.topicName, scores: [] };
        topicMap[s.topicId].scores.push(s.score);
      }
    }

    const topicScoresJson = Object.entries(topicMap).map(([id, v]) => ({
      topicId: Number(id),
      topicName: v.name,
      avgScore: v.scores.reduce((a, b) => a + b, 0) / v.scores.length,
    }));

    const sectorMap: Record<string, number[]> = {};
    for (const r of responses) {
      if (!sectorMap[r.sector]) sectorMap[r.sector] = [];
      if (r.totalScore != null) sectorMap[r.sector].push(r.totalScore);
    }
    const sectorScoresJson = Object.entries(sectorMap).map(([sector, scores]) => ({
      sector,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      count: scores.length,
    }));

    const overallScore =
      responses.reduce((s, r) => s + (r.totalScore ?? 0), 0) / responses.length;

    const riskLevel =
      overallScore <= 25 ? "LOW" :
      overallScore <= 50 ? "MEDIUM" :
      overallScore <= 75 ? "HIGH" : "CRITICAL";

    const snapshot = await prisma.campaignSnapshot.create({
      data: {
        campaignId: id,
        totalResponses: responses.length,
        overallScore,
        riskLevel: riskLevel as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
        topicScoresJson,
        sectorScoresJson,
      },
    });

    return NextResponse.json({ snapshot });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
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

    const url = new URL(req.url);
    // fix #15 — pagination (default last 100 snapshots for charts)
    const take = Math.min(Number(url.searchParams.get("take") ?? 100), 500);
    const skip = Number(url.searchParams.get("skip") ?? 0);

    const snapshots = await prisma.campaignSnapshot.findMany({
      where: { campaignId: id },
      orderBy: { snapshotDate: "asc" },
      take,
      skip,
    });
    return NextResponse.json({ snapshots, take, skip });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

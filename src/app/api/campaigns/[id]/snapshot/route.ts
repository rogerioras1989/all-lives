import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getTenantContext,
  requireCampaignOwnership,
  requireTenantAnalytics,
  requireTenantManagement,
  tenantError,
} from "@/lib/tenant";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getTenantContext(req);
    await requireCampaignOwnership(id, ctx);
    requireTenantManagement(ctx);

    // fix #12 — usar aggregações em vez de carregar todas as respostas em memória
    const totalResponses = await prisma.response.count({ where: { campaignId: id } });

    if (totalResponses === 0) {
      return NextResponse.json({ error: "Sem respostas" }, { status: 400 });
    }

    const topicGroups = await prisma.topicScore.groupBy({
      by: ["topicId", "topicName"],
      where: { response: { campaignId: id } },
      _avg: { score: true },
    });

    const topicScoresJson = topicGroups.map((g) => ({
      topicId: g.topicId,
      topicName: g.topicName,
      avgScore: g._avg.score ?? 0,
    }));

    const sectorGroups = await prisma.response.groupBy({
      by: ["sector"],
      where: { campaignId: id, totalScore: { not: null } },
      _avg: { totalScore: true },
      _count: { totalScore: true },
    });

    const sectorScoresJson = sectorGroups.map((g) => ({
      sector: g.sector,
      avgScore: g._avg.totalScore ?? 0,
      count: g._count.totalScore,
    }));

    const overallAgg = await prisma.response.aggregate({
      where: { campaignId: id },
      _avg: { totalScore: true },
    });
    const overallScore = overallAgg._avg.totalScore ?? 0;

    const riskLevel =
      overallScore <= 25 ? "LOW" :
      overallScore <= 50 ? "MEDIUM" :
      overallScore <= 75 ? "HIGH" : "CRITICAL";

    const snapshot = await prisma.campaignSnapshot.create({
      data: {
        campaignId: id,
        totalResponses,
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
    requireTenantAnalytics(ctx);

    const url = new URL(req.url);
    // fix #15 — pagination (default last 100 snapshots for charts)
    const take = Math.min(Number(url.searchParams.get("take") ?? 100), 500);
    // A-6: limitar skip para evitar full table scan forçado (DoS)
    const skip = Math.min(Math.max(Number(url.searchParams.get("skip") ?? 0), 0), 10000);

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

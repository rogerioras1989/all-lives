import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getTenantContext,
  isManagerRestricted,
  requireCampaignOwnership,
  requireTenantAnalytics,
  tenantError,
} from "@/lib/tenant";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getTenantContext(req);
    await requireCampaignOwnership(id, ctx);
    requireTenantAnalytics(ctx);

    // Feature 6: MANAGER sees only their own sector
    let managerSector: string | undefined;
    if (isManagerRestricted(ctx)) {
      const user = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { sector: true } });
      managerSector = user?.sector ?? undefined;
    }

    const { searchParams } = new URL(req.url);
    const sector = managerSector ?? searchParams.get("sector") ?? undefined;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const responseWhere = {
      campaignId: id,
      ...(sector ? { sector } : {}),
      ...((startDate || endDate) ? {
        createdAt: {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate + "T23:59:59.999Z") } : {}),
        },
      } : {}),
    };

    // fix #19 — usar aggregações em vez de carregar N×9 scores em memória
    const totalResponses = await prisma.response.count({ where: responseWhere });

    if (totalResponses === 0) {
      return NextResponse.json({
        totalResponses: 0,
        overallAverage: 0,
        topicAverages: [],
        sectorSummary: [],
      });
    }

    const [topicGroups, topicRiskGroups] = await Promise.all([
      prisma.topicScore.groupBy({
        by: ["topicId", "topicName"],
        where: { response: responseWhere },
        _avg: { score: true },
      }),
      prisma.topicScore.groupBy({
        by: ["topicId", "riskLevel"],
        where: { response: responseWhere },
        _count: { id: true },
      }),
    ]);

    const riskDistributionByTopic = topicRiskGroups.reduce<Record<number, Record<string, number>>>(
      (acc, group) => {
        acc[group.topicId] ??= { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
        acc[group.topicId][group.riskLevel] = group._count.id;
        return acc;
      },
      {}
    );

    const topicAverages = topicGroups.map((g) => ({
      topicId: g.topicId,
      topicName: g.topicName,
      averageScore: g._avg.score ?? 0,
      riskDistribution: riskDistributionByTopic[g.topicId] ?? { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
    }));

    const sectorGroups = await prisma.response.groupBy({
      by: ["sector"],
      where: responseWhere,
      _avg: { totalScore: true },
      _count: { totalScore: true },
    });

    const sectorSummary = sectorGroups.map((g) => ({
      sector: g.sector,
      count: g._count.totalScore,
      averageScore: g._avg.totalScore ?? 0,
    }));

    const overallAgg = await prisma.response.aggregate({
      where: responseWhere,
      _avg: { totalScore: true },
    });
    const overallAverage = overallAgg._avg.totalScore ?? 0;

    return NextResponse.json({ totalResponses, overallAverage, topicAverages, sectorSummary });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

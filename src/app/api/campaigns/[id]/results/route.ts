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

    const topicGroups = await prisma.topicScore.groupBy({
      by: ["topicId", "topicName"],
      where: { response: responseWhere },
      _avg: { score: true },
    });

    const topicAverages = await Promise.all(
      topicGroups.map(async (g) => {
        const [low, medium, high, critical] = await Promise.all([
          prisma.topicScore.count({ where: { response: responseWhere, topicId: g.topicId, score: { lte: 25 } } }),
          prisma.topicScore.count({ where: { response: responseWhere, topicId: g.topicId, score: { gt: 25, lte: 50 } } }),
          prisma.topicScore.count({ where: { response: responseWhere, topicId: g.topicId, score: { gt: 50, lte: 75 } } }),
          prisma.topicScore.count({ where: { response: responseWhere, topicId: g.topicId, score: { gt: 75 } } }),
        ]);
        return {
          topicId: g.topicId,
          topicName: g.topicName,
          averageScore: g._avg.score ?? 0,
          riskDistribution: { LOW: low, MEDIUM: medium, HIGH: high, CRITICAL: critical },
        };
      })
    );

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

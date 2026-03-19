import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getTenantContext,
  isManagerRestricted,
  requireCampaignOwnership,
  requireTenantAnalytics,
  tenantError,
} from "@/lib/tenant";
import { TOPICS } from "@/data/questionnaire";

const MIN_GROUP_SIZE = 3;

function getRisk(score: number) {
  if (score <= 25) return "LOW";
  if (score <= 50) return "MEDIUM";
  if (score <= 75) return "HIGH";
  return "CRITICAL";
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

    let managerSector: string | undefined;
    if (isManagerRestricted(ctx)) {
      const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { sector: true },
      });
      managerSector = user?.sector ?? undefined;
    }

    const { searchParams } = new URL(req.url);
    const sector = managerSector ?? searchParams.get("sector") ?? undefined;

    const where = {
      campaignId: id,
      ...(sector ? { sector } : {}),
    };

    const sectorGroups = await prisma.response.groupBy({
      by: ["sector"],
      where,
      _count: { id: true },
      _avg: { totalScore: true },
      _max: { createdAt: true },
    });

    const visibleGroups = sectorGroups.filter((group) => group._count.id >= MIN_GROUP_SIZE);
    const suppressedGroups = sectorGroups.length - visibleGroups.length;

    const groups = await Promise.all(
      visibleGroups.map(async (group) => {
        const topicAverages = await prisma.topicScore.groupBy({
          by: ["topicId", "topicName"],
          where: {
            response: {
              campaignId: id,
              sector: group.sector,
            },
          },
          _avg: { score: true },
        });

        const topTopics = topicAverages
          .map((topic) => ({
            topicId: topic.topicId,
            topicName:
              topic.topicName ||
              TOPICS.find((item) => item.id === topic.topicId)?.title ||
              `Tópico ${topic.topicId}`,
            averageScore: Math.round(topic._avg.score ?? 0),
            riskLevel: getRisk(topic._avg.score ?? 0),
          }))
          .sort((left, right) => right.averageScore - left.averageScore)
          .slice(0, 3);

        return {
          sector: group.sector,
          totalResponses: group._count.id,
          averageScore: Math.round(group._avg.totalScore ?? 0),
          riskLevel: getRisk(group._avg.totalScore ?? 0),
          latestResponseDate: group._max.createdAt?.toISOString().slice(0, 10) ?? null,
          topTopics,
        };
      })
    );

    return NextResponse.json({
      groups,
      minimumGroupSize: MIN_GROUP_SIZE,
      suppressedGroups,
      totalResponses: sectorGroups.reduce((sum, group) => sum + group._count.id, 0),
    });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

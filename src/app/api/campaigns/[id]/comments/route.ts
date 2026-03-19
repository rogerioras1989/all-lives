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

export const dynamic = "force-dynamic";

const MIN_TOPIC_COMMENTS = 3;

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
    const topicId = searchParams.get("topicId");
    const comments = await prisma.topicComment.findMany({
      where: {
        response: { campaignId: id },
        ...(managerSector ? { response: { campaignId: id, sector: managerSector } } : {}),
        ...(topicId ? { topicId: Number(topicId) } : {}),
      },
      select: {
        topicId: true,
        createdAt: true,
      },
    });

    const grouped = comments.reduce<Record<number, { totalComments: number; latestCommentAt: string | null }>>(
      (acc, comment) => {
        acc[comment.topicId] ??= { totalComments: 0, latestCommentAt: null };
        acc[comment.topicId].totalComments += 1;
        const createdAt = comment.createdAt.toISOString();
        if (!acc[comment.topicId].latestCommentAt || createdAt > acc[comment.topicId].latestCommentAt!) {
          acc[comment.topicId].latestCommentAt = createdAt;
        }
        return acc;
      },
      {}
    );

    const topics = Object.entries(grouped)
      .map(([rawTopicId, info]) => {
        const topicId = Number(rawTopicId);
        return {
          topicId,
          topicName: TOPICS.find((topic) => topic.id === topicId)?.title ?? `Tópico ${topicId}`,
          totalComments: info.totalComments,
          latestCommentAt: info.latestCommentAt,
        };
      })
      .filter((topic) => topic.totalComments >= MIN_TOPIC_COMMENTS)
      .sort((left, right) => right.totalComments - left.totalComments);

    return NextResponse.json({
      topics,
      minimumGroupSize: MIN_TOPIC_COMMENTS,
      suppressedTopics: Object.keys(grouped).length - topics.length,
    });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

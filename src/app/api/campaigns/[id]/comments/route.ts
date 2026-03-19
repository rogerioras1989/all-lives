import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getTenantContext,
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

    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("topicId");
    // fix #15 — pagination
    const take = Math.min(Number(searchParams.get("take") ?? 50), 200);
    const skip = Number(searchParams.get("skip") ?? 0);

    const comments = await prisma.topicComment.findMany({
      where: {
        response: { campaignId: id },
        ...(topicId ? { topicId: Number(topicId) } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true, topicId: true, text: true, isAnonymous: true, createdAt: true,
      },
    });

    return NextResponse.json({ comments, take, skip });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

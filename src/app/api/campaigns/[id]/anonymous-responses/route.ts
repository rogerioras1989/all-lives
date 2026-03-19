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

    let managerSector: string | undefined;
    if (isManagerRestricted(ctx)) {
      const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { sector: true },
      });
      managerSector = user?.sector ?? undefined;
    }

    const { searchParams } = new URL(req.url);
    const take = Math.min(Number(searchParams.get("take") ?? 20), 100);
    const skip = Math.max(Number(searchParams.get("skip") ?? 0), 0);
    const sector = managerSector ?? searchParams.get("sector") ?? undefined;

    const where = {
      campaignId: id,
      ...(sector ? { sector } : {}),
    };

    const [responses, total] = await Promise.all([
      prisma.response.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        select: {
          id: true,
          sector: true,
          jobTitle: true,
          totalScore: true,
          riskLevel: true,
          createdAt: true,
          scores: {
            orderBy: { topicId: "asc" },
            select: {
              topicId: true,
              topicName: true,
              score: true,
              riskLevel: true,
            },
          },
          comments: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              topicId: true,
              text: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.response.count({ where }),
    ]);

    return NextResponse.json({ responses, total, take, skip });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

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

    const plans = await prisma.actionPlan.findMany({
      where: { campaignId: id, companyId: ctx.companyId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(plans);
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getTenantContext(req);
    await requireCampaignOwnership(id, ctx);

    const body = await req.json();
    const { title, description, sector, assignedTo, dueDate } = body;

    if (!title) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });

    const plan = await prisma.actionPlan.create({
      data: {
        campaignId: id,
        companyId: ctx.companyId,
        title,
        description,
        sector,
        assignedTo,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        createdBy: ctx.userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId: ctx.companyId,
        action: "ACTION_PLAN_CREATED",
        entityType: "ActionPlan",
        entityId: plan.id,
        performedBy: ctx.userId,
        performedByType: ctx.type === "consultant" ? "Consultant" : "User",
        metadata: { title, sector },
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

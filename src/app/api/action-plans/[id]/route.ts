import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, requireTenantManagement, tenantError } from "@/lib/tenant";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getTenantContext(req);
    requireTenantManagement(ctx);

    const existing = await prisma.actionPlan.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (existing.companyId !== ctx.companyId) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    const body = await req.json();
    const { title, description, sector, assignedTo, dueDate, status } = body;

    const updated = await prisma.actionPlan.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(sector !== undefined && { sector }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(status !== undefined && { status, closedAt: ["DONE", "CANCELLED"].includes(status) ? new Date() : null }),
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId: ctx.companyId,
        action: "ACTION_PLAN_UPDATED",
        entityType: "ActionPlan",
        entityId: id,
        performedBy: ctx.userId,
        performedByType: ctx.type === "consultant" ? "Consultant" : "User",
        metadata: { status, previousStatus: existing.status },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getTenantContext(req);
    requireTenantManagement(ctx);

    const existing = await prisma.actionPlan.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (existing.companyId !== ctx.companyId) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    await prisma.actionPlan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

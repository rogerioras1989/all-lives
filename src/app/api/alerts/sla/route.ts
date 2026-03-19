import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, requireTenantAnalytics, requireTenantManagement, tenantError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const SLA_HOURS: Record<string, number> = {
  CRITICAL: 24,
  HIGH: 72,
  MEDIUM: 168,
  LOW: 336,
};

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    requireTenantAnalytics(ctx);
    const alerts = await prisma.sectorAlert.findMany({
      where: { companyId: ctx.companyId, resolvedAt: null },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const enriched = alerts.map((a) => {
      const slaHours = a.slaHours ?? SLA_HOURS[a.riskLevel] ?? 168;
      const deadline = new Date(a.createdAt.getTime() + slaHours * 60 * 60 * 1000);
      const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      const isOverdue = hoursLeft < 0;
      const isUrgent = hoursLeft < 6 && hoursLeft >= 0;

      return {
        ...a,
        slaHours,
        deadline,
        hoursLeft: Math.max(0, Math.round(hoursLeft)),
        isOverdue,
        isUrgent,
      };
    });

    return NextResponse.json(enriched);
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    requireTenantManagement(ctx);
    const body = await req.json();
    const { id, action } = body;

    const alert = await prisma.sectorAlert.findUnique({ where: { id } });
    if (!alert || alert.companyId !== ctx.companyId) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    const updated = await prisma.sectorAlert.update({
      where: { id },
      data: {
        ...(action === "acknowledge" && { acknowledgedAt: new Date(), isRead: true, readAt: new Date() }),
        ...(action === "resolve" && { resolvedAt: new Date(), isRead: true }),
        ...(action === "assign" && { assignedTo: body.assignedTo }),
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId: ctx.companyId,
        action: `ALERT_${action.toUpperCase()}`,
        entityType: "SectorAlert",
        entityId: id,
        performedBy: ctx.userId,
        performedByType: ctx.type === "consultant" ? "Consultant" : "User",
        metadata: { sector: alert.sector, riskLevel: alert.riskLevel },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, requireTenantAnalytics, requireTenantManagement, tenantError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    requireTenantAnalytics(ctx);
    const alerts = await prisma.sectorAlert.findMany({
      where: { companyId: ctx.companyId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const consultantLink = await prisma.consultantCompany.findFirst({
      where: { companyId: ctx.companyId, schedulingUrl: { not: null } },
      select: { schedulingUrl: true }
    });

    return NextResponse.json({ 
      alerts, 
      schedulingUrl: consultantLink?.schedulingUrl ?? null 
    });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    requireTenantManagement(ctx);
    const { alertId } = await req.json();
    await prisma.sectorAlert.updateMany({
      where: { id: alertId, companyId: ctx.companyId },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

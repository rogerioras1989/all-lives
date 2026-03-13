import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, tenantError } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    const alerts = await prisma.sectorAlert.findMany({
      where: { companyId: ctx.companyId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ alerts });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
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

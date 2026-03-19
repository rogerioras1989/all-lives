import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, requireTenantAnalytics, tenantError } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    requireTenantAnalytics(ctx);
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
    const offset = Math.min(Math.max(parseInt(searchParams.get("offset") ?? "0"), 0), 5000);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { companyId: ctx.companyId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where: { companyId: ctx.companyId } }),
    ]);

    return NextResponse.json({ logs, total });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function POST() {
  return NextResponse.json(
    { error: "Criação manual de auditoria desabilitada" },
    { status: 405 }
  );
}

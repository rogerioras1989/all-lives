import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, tenantError } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
    const offset = parseInt(searchParams.get("offset") ?? "0");

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

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    const body = await req.json();
    const { action, entityType, entityId, metadata } = body;

    const log = await prisma.auditLog.create({
      data: {
        companyId: ctx.companyId,
        action,
        entityType,
        entityId,
        performedBy: ctx.userId,
        performedByType: ctx.type === "consultant" ? "Consultant" : "User",
        metadata,
      },
    });
    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, tenantError } from "@/lib/tenant";
import { randomUUID } from "crypto";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getTenantContext(req);
    if (ctx.companyId !== id) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    const integration = await prisma.hrIntegration.findUnique({ where: { companyId: id } });
    return NextResponse.json(integration ?? null);
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
    if (ctx.companyId !== id && ctx.type !== "consultant") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    const integration = await prisma.hrIntegration.upsert({
      where: { companyId: id },
      update: { apiKey: randomUUID(), updatedAt: new Date() },
      create: { companyId: id, apiKey: randomUUID() },
    });
    return NextResponse.json(integration);
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

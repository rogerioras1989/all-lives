import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash, randomUUID } from "crypto";
import {
  getTenantContext,
  requireTenantCompanyMatch,
  requireTenantManagement,
  tenantError,
} from "@/lib/tenant";

function hashIntegrationKey(rawKey: string) {
  return createHash("sha256").update(rawKey).digest("hex");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getTenantContext(req);
    requireTenantManagement(ctx);
    requireTenantCompanyMatch(ctx, id);

    const integration = await prisma.hrIntegration.findUnique({ where: { companyId: id } });
    return NextResponse.json(
      integration
        ? {
            id: integration.id,
            companyId: integration.companyId,
            hasApiKey: true,
            lastSyncAt: integration.lastSyncAt,
            syncLog: integration.syncLog,
            createdAt: integration.createdAt,
            updatedAt: integration.updatedAt,
          }
        : null
    );
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
    requireTenantManagement(ctx);
    requireTenantCompanyMatch(ctx, id);

    const apiKey = randomUUID();

    const integration = await prisma.hrIntegration.upsert({
      where: { companyId: id },
      update: { apiKey: hashIntegrationKey(apiKey), updatedAt: new Date() },
      create: { companyId: id, apiKey: hashIntegrationKey(apiKey) },
    });
    return NextResponse.json({
      id: integration.id,
      companyId: integration.companyId,
      apiKey,
      hasApiKey: true,
      lastSyncAt: integration.lastSyncAt,
      syncLog: integration.syncLog,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getTenantContext,
  requireTenantAnalytics,
  requireTenantCompanyMatch,
  requireTenantManagement,
  tenantError,
} from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const ctx = await getTenantContext(req);
    requireTenantAnalytics(ctx);
    requireTenantCompanyMatch(ctx, companyId);

    const campaigns = await prisma.campaign.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, status: true, slug: true,
        startDate: true, endDate: true, createdAt: true,
        _count: { select: { responses: true } },
      },
    });

    return NextResponse.json({ campaigns });
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
    const { id: companyId } = await params;
    const ctx = await getTenantContext(req);
    requireTenantManagement(ctx);
    requireTenantCompanyMatch(ctx, companyId);

    const body = await req.json();
    const { title, description, startDate, endDate } = body;
    if (!title) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });

    const parsedStart = startDate ? new Date(startDate) : undefined;
    const parsedEnd = endDate ? new Date(endDate) : undefined;
    if (parsedStart && isNaN(parsedStart.getTime())) {
      return NextResponse.json({ error: "Data de início inválida" }, { status: 400 });
    }
    if (parsedEnd && isNaN(parsedEnd.getTime())) {
      return NextResponse.json({ error: "Data de término inválida" }, { status: 400 });
    }
    if (parsedStart && parsedEnd && parsedEnd <= parsedStart) {
      return NextResponse.json({ error: "Data de término deve ser posterior à data de início" }, { status: 400 });
    }

    const baseSlug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${Date.now()}`;

    const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        status: "DRAFT",
        companyId,
        slug,
        startDate: parsedStart,
        endDate: parsedEnd,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

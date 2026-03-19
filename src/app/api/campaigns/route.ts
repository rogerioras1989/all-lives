import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, requireTenantAnalytics, requireTenantManagement, tenantError } from "@/lib/tenant";

// fix #1 — ambas as rotas agora exigem autenticação e isolamento por tenant
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    requireTenantAnalytics(ctx);
    const campaigns = await prisma.campaign.findMany({
      where: { companyId: ctx.companyId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { responses: true } },
      },
    });
    return NextResponse.json(campaigns);
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

// fix #2 — POST corrigido: usa companyId (FK), gera slug único, status DRAFT, requer auth
export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    requireTenantManagement(ctx);
    const body = await req.json();
    const { title, description, startDate, endDate } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      );
    }

    // M-2: validar consistência de datas
    const parsedStart = startDate ? new Date(startDate) : undefined;
    const parsedEnd = endDate ? new Date(endDate) : undefined;
    if (parsedStart && isNaN(parsedStart.getTime())) {
      return NextResponse.json({ error: "Data de início inválida" }, { status: 400 });
    }
    if (parsedEnd && isNaN(parsedEnd.getTime())) {
      return NextResponse.json({ error: "Data de término inválida" }, { status: 400 });
    }
    if (parsedStart && parsedEnd && parsedEnd <= parsedStart) {
      return NextResponse.json(
        { error: "Data de término deve ser posterior à data de início" },
        { status: 400 }
      );
    }

    // Gera slug único baseado no título + timestamp
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
        companyId: ctx.companyId,
        slug,
        startDate: parsedStart,
        endDate: parsedEnd,
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, tenantError } from "@/lib/tenant";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const ctx = await getTenantContext(req);

    // User must belong to this company; consultant must be linked
    if (ctx.type === "user" && ctx.companyId !== companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (ctx.type === "consultant") {
      const link = await prisma.consultantCompany.findUnique({
        where: { consultantId_companyId: { consultantId: ctx.userId, companyId } },
      });
      if (!link) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    if (ctx.type === "user" && !["ADMIN", "HR", "MANAGER"].includes(ctx.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (ctx.type === "user" && ctx.companyId !== companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, startDate, endDate } = body;
    if (!title) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });

    const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        status: "DRAFT",
        companyId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

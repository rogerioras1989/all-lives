import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware";

export const dynamic = "force-dynamic";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    // Only consultants can call this
    if (payload.type !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const companies = payload.role === "OWNER"
      ? (await prisma.company.findMany({
          orderBy: { name: "asc" },
          include: {
            campaigns: {
              select: { id: true, title: true, status: true, slug: true, createdAt: true },
              orderBy: { createdAt: "desc" },
              take: 20,
            },
            _count: { select: { users: true, campaigns: true, alerts: true, actionPlans: true } },
          },
        })).map((company) => ({
          id: company.id,
          name: company.name,
          cnpj: company.cnpj,
          slug: company.slug,
          role: "OWNER",
          totalUsers: company._count.users,
          totalCampaigns: company._count.campaigns,
          totalAlerts: company._count.alerts,
          totalActionPlans: company._count.actionPlans,
          campaigns: company.campaigns,
        }))
      : (await prisma.consultantCompany.findMany({
          where: { consultantId: payload.sub },
          include: {
            company: {
              include: {
                campaigns: {
                  select: { id: true, title: true, status: true, slug: true, createdAt: true },
                  orderBy: { createdAt: "desc" },
                  take: 20,
                },
                _count: { select: { users: true, campaigns: true, alerts: true, actionPlans: true } },
              },
            },
          },
        })).map((l) => ({
          id: l.company.id,
          name: l.company.name,
          cnpj: l.company.cnpj,
          slug: l.company.slug,
          role: l.role,
          totalUsers: l.company._count.users,
          totalCampaigns: l.company._count.campaigns,
          totalAlerts: l.company._count.alerts,
          totalActionPlans: l.company._count.actionPlans,
          campaigns: l.company.campaigns,
        }));

    return NextResponse.json({
      companies,
      viewer: { id: payload.sub, role: payload.role },
    });
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: err.message }, { status: err.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.type !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (payload.role === "ANALYST") {
      return NextResponse.json({ error: "Analistas não podem cadastrar tenants" }, { status: 403 });
    }

    const body = await req.json();
    const companyName = String(body.name ?? "").trim();
    const cnpj = String(body.cnpj ?? "").trim() || null;
    const slugInput = String(body.slug ?? "").trim();
    const createInitialCampaign = body.createInitialCampaign !== false;
    const campaignTitle = String(body.campaignTitle ?? "").trim();

    if (!companyName) {
      return NextResponse.json({ error: "Nome da empresa é obrigatório" }, { status: 400 });
    }

    const baseSlug = slugify(slugInput || companyName);
    if (!baseSlug) {
      return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const slugConflicts = await tx.company.count({
        where: {
          slug: {
            startsWith: baseSlug,
          },
        },
      });
      const finalSlug = slugConflicts === 0 ? baseSlug : `${baseSlug}-${slugConflicts + 1}`;

      const company = await tx.company.create({
        data: {
          name: companyName,
          cnpj,
          slug: finalSlug,
        },
      });

      await tx.consultantCompany.upsert({
        where: {
          consultantId_companyId: {
            consultantId: payload.sub,
            companyId: company.id,
          },
        },
        update: { role: "ADMIN" },
        create: {
          consultantId: payload.sub,
          companyId: company.id,
          role: "ADMIN",
        },
      });

      const campaign = createInitialCampaign
        ? await tx.campaign.create({
            data: {
              title: campaignTitle || "Campanha inicial de diagnóstico",
              description: "Campanha criada no cadastro inicial do tenant",
              status: "DRAFT",
              slug: `${finalSlug}-campanha-${Date.now()}`,
              companyId: company.id,
            },
          })
        : null;

      return { company, campaign };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: err.message }, { status: err.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

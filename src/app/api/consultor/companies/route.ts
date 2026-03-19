import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware";

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

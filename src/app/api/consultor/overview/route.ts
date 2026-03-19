import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.type !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const scopedCompanyIds = payload.role === "OWNER"
      ? null
      : (await prisma.consultantCompany.findMany({
          where: { consultantId: payload.sub },
          select: { companyId: true, role: true },
        }));

    const companyIds = scopedCompanyIds?.map((link) => link.companyId) ?? [];
    const companyWhere = scopedCompanyIds ? { id: { in: companyIds } } : {};
    const campaignWhere = scopedCompanyIds ? { companyId: { in: companyIds } } : {};
    const alertWhere = scopedCompanyIds ? { companyId: { in: companyIds } } : {};
    const actionPlanWhere = scopedCompanyIds ? { companyId: { in: companyIds } } : {};

    const [companies, campaigns, unresolvedAlerts, openPlans] = await Promise.all([
      prisma.company.findMany({
        where: companyWhere,
        orderBy: { name: "asc" },
        include: {
          campaigns: {
            select: { id: true, title: true, status: true, slug: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
          _count: { select: { users: true, campaigns: true } },
        },
      }),
      prisma.campaign.findMany({
        where: campaignWhere,
        select: {
          id: true,
          companyId: true,
          status: true,
          _count: { select: { responses: true } },
        },
      }),
      prisma.sectorAlert.groupBy({
        by: ["companyId"],
        where: { ...alertWhere, resolvedAt: null },
        _count: { id: true },
      }),
      prisma.actionPlan.groupBy({
        by: ["companyId"],
        where: { ...actionPlanWhere, status: { in: ["PENDING", "IN_PROGRESS"] } },
        _count: { id: true },
      }),
    ]);

    const unresolvedByCompany = new Map(
      unresolvedAlerts.map((item) => [item.companyId, item._count.id])
    );
    const openPlansByCompany = new Map(
      openPlans.map((item) => [item.companyId, item._count.id])
    );

    const campaignsByCompany = campaigns.reduce<Record<string, typeof campaigns>>((acc, campaign) => {
      acc[campaign.companyId] ??= [];
      acc[campaign.companyId].push(campaign);
      return acc;
    }, {});

    const companyCards = companies.map((company) => {
      const companyCampaigns = campaignsByCompany[company.id] ?? [];
      const totalResponses = companyCampaigns.reduce((sum, campaign) => sum + campaign._count.responses, 0);
      const activeCampaigns = companyCampaigns.filter((campaign) => campaign.status === "ACTIVE").length;

      return {
        id: company.id,
        name: company.name,
        slug: company.slug,
        totalUsers: company._count.users,
        totalCampaigns: company._count.campaigns,
        totalResponses,
        activeCampaigns,
        unresolvedAlerts: unresolvedByCompany.get(company.id) ?? 0,
        openActionPlans: openPlansByCompany.get(company.id) ?? 0,
        lastCampaign: company.campaigns[0] ?? null,
      };
    });

    const totals = companyCards.reduce(
      (acc, company) => ({
        companies: acc.companies + 1,
        totalUsers: acc.totalUsers + company.totalUsers,
        totalCampaigns: acc.totalCampaigns + company.totalCampaigns,
        totalResponses: acc.totalResponses + company.totalResponses,
        activeCampaigns: acc.activeCampaigns + company.activeCampaigns,
        unresolvedAlerts: acc.unresolvedAlerts + company.unresolvedAlerts,
        openActionPlans: acc.openActionPlans + company.openActionPlans,
      }),
      {
        companies: 0,
        totalUsers: 0,
        totalCampaigns: 0,
        totalResponses: 0,
        activeCampaigns: 0,
        unresolvedAlerts: 0,
        openActionPlans: 0,
      }
    );

    return NextResponse.json({
      viewer: { id: payload.sub, role: payload.role },
      totals,
      companies: companyCards,
    });
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: err.message }, { status: err.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

import type { AccessTokenPayload } from "@/lib/auth";
import { getRiskLevel } from "@/data/questionnaire";
import { prisma } from "@/lib/prisma";

export type TenantHealthStatus = "HEALTHY" | "WATCH" | "CRITICAL";

export type ConsultantCampaignSummary = {
  id: string;
  title: string;
  status: string;
  slug: string;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
  responseCount: number;
};

export type ConsultantCompanySummary = {
  id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  tenantRole: string;
  totalUsers: number;
  totalCampaigns: number;
  totalResponses: number;
  activeCampaigns: number;
  unresolvedAlerts: number;
  openActionPlans: number;
  linkedConsultants: number;
  hasInitialAdmin: boolean;
  hasActiveCampaign: boolean;
  integrationConfigured: boolean;
  currentRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  latestResponseAt: string | null;
  lastSyncAt: string | null;
  lastActivityAt: string | null;
  onboarding: {
    companyCreated: boolean;
    adminCreated: boolean;
    campaignCreated: boolean;
    integrationConfigured: boolean;
    firstResponseReceived: boolean;
    completedSteps: number;
    totalSteps: number;
    incomplete: boolean;
  };
  healthStatus: TenantHealthStatus;
  healthReason: string;
  campaignStatuses: string[];
  lastCampaign: ConsultantCampaignSummary | null;
  campaigns: ConsultantCampaignSummary[];
};

type CompanyLink = {
  companyId: string;
  role: string;
};

async function getScopedLinks(payload: AccessTokenPayload) {
  if (payload.type !== "consultant") {
    throw new Error("FORBIDDEN");
  }

  if (payload.role === "OWNER") {
    return null;
  }

  return prisma.consultantCompany.findMany({
    where: { consultantId: payload.sub },
    select: { companyId: true, role: true },
  });
}

function getHealth(
  company: Pick<
    ConsultantCompanySummary,
    | "currentRiskLevel"
    | "unresolvedAlerts"
    | "openActionPlans"
    | "onboarding"
    | "hasActiveCampaign"
    | "lastActivityAt"
  >
): { status: TenantHealthStatus; reason: string } {
  const now = Date.now();
  const lastActivityAgeMs = company.lastActivityAt
    ? now - new Date(company.lastActivityAt).getTime()
    : Number.POSITIVE_INFINITY;
  const noRecentActivity = lastActivityAgeMs > 1000 * 60 * 60 * 24 * 30;

  if (
    company.currentRiskLevel === "CRITICAL" ||
    company.unresolvedAlerts > 0
  ) {
    return {
      status: "CRITICAL",
      reason: company.unresolvedAlerts > 0
        ? "Há alertas abertos exigindo atuação imediata."
        : "O risco consolidado do tenant está em nível crítico.",
    };
  }

  if (
    company.currentRiskLevel === "HIGH" ||
    company.openActionPlans > 0 ||
    company.onboarding.incomplete ||
    !company.hasActiveCampaign ||
    noRecentActivity
  ) {
    if (company.onboarding.incomplete) {
      return { status: "WATCH", reason: "O onboarding ainda não foi concluído." };
    }
    if (!company.hasActiveCampaign) {
      return { status: "WATCH", reason: "Não há campanha ativa no momento." };
    }
    if (company.currentRiskLevel === "HIGH") {
      return { status: "WATCH", reason: "O risco consolidado está em nível alto." };
    }
    if (company.openActionPlans > 0) {
      return { status: "WATCH", reason: "Existem planos de ação em acompanhamento." };
    }
    return { status: "WATCH", reason: "O tenant está sem atividade recente." };
  }

  return {
    status: "HEALTHY",
    reason: "Onboarding concluído e operação sem alertas pendentes.",
  };
}

export async function getConsultantCompanySummaries(payload: AccessTokenPayload) {
  const scopedLinks = await getScopedLinks(payload);
  const companyIds = scopedLinks?.map((link) => link.companyId) ?? [];
  const roleByCompany = new Map<string, string>(
    (scopedLinks ?? []).map((link: CompanyLink) => [link.companyId, link.role])
  );

  const companies = await prisma.company.findMany({
    where: scopedLinks ? { id: { in: companyIds } } : undefined,
    orderBy: { name: "asc" },
    include: {
      campaigns: {
        select: {
          id: true,
          title: true,
          status: true,
          slug: true,
          createdAt: true,
          startDate: true,
          endDate: true,
          _count: { select: { responses: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      hrIntegration: {
        select: {
          id: true,
          lastSyncAt: true,
          updatedAt: true,
        },
      },
      _count: {
        select: {
          users: true,
          campaigns: true,
          alerts: true,
          actionPlans: true,
          consultants: true,
        },
      },
    },
  });

  if (companies.length === 0) {
    return [];
  }

  const resolvedCompanyIds = companies.map((company) => company.id);
  const campaignIds = companies.flatMap((company) => company.campaigns.map((campaign) => campaign.id));

  const [userRoles, unresolvedAlerts, openPlans, responseAgg] = await Promise.all([
    prisma.user.groupBy({
      by: ["companyId", "role"],
      where: {
        companyId: { in: resolvedCompanyIds },
      },
      _count: { id: true },
    }),
    prisma.sectorAlert.groupBy({
      by: ["companyId"],
      where: {
        companyId: { in: resolvedCompanyIds },
        resolvedAt: null,
      },
      _count: { id: true },
    }),
    prisma.actionPlan.groupBy({
      by: ["companyId"],
      where: {
        companyId: { in: resolvedCompanyIds },
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      _count: { id: true },
    }),
    campaignIds.length > 0
      ? prisma.response.groupBy({
          by: ["campaignId"],
          where: {
            campaignId: { in: campaignIds },
            totalScore: { not: null },
          },
          _avg: { totalScore: true },
          _count: { id: true },
          _max: { createdAt: true },
        })
      : Promise.resolve([]),
  ]);

  const unresolvedByCompany = new Map(
    unresolvedAlerts.map((item) => [item.companyId, item._count.id])
  );
  const openPlansByCompany = new Map(
    openPlans.map((item) => [item.companyId, item._count.id])
  );

  const userRoleMap = new Map<string, Record<string, number>>();
  for (const item of userRoles) {
    if (!item.companyId) continue;
    userRoleMap.set(item.companyId, {
      ...(userRoleMap.get(item.companyId) ?? {}),
      [item.role]: item._count.id,
    });
  }

  const responseAggByCampaign = new Map(
    responseAgg.map((item) => [item.campaignId, item])
  );

  return companies.map((company) => {
    const campaigns = company.campaigns.map((campaign) => ({
      id: campaign.id,
      title: campaign.title,
      status: campaign.status,
      slug: campaign.slug,
      createdAt: campaign.createdAt.toISOString(),
      startDate: campaign.startDate?.toISOString() ?? null,
      endDate: campaign.endDate?.toISOString() ?? null,
      responseCount: campaign._count.responses,
    }));

    const totalResponses = campaigns.reduce(
      (sum, campaign) => sum + campaign.responseCount,
      0
    );
    const activeCampaigns = campaigns.filter((campaign) => campaign.status === "ACTIVE").length;
    const hasInitialAdmin = Boolean(
      (userRoleMap.get(company.id)?.ADMIN ?? 0) + (userRoleMap.get(company.id)?.HR ?? 0)
    );

    let weightedScore = 0;
    let weightedResponses = 0;
    let latestResponseAt: string | null = null;

    for (const campaign of campaigns) {
      const aggregate = responseAggByCampaign.get(campaign.id);
      if (!aggregate) continue;
      weightedScore += (aggregate._avg.totalScore ?? 0) * aggregate._count.id;
      weightedResponses += aggregate._count.id;

      const candidate = aggregate._max.createdAt?.toISOString() ?? null;
      if (candidate && (!latestResponseAt || candidate > latestResponseAt)) {
        latestResponseAt = candidate;
      }
    }

    const currentAverage = weightedResponses > 0 ? weightedScore / weightedResponses : null;
    const currentRiskLevel = currentAverage === null ? null : getRiskLevel(currentAverage);
    const onboarding = {
      companyCreated: true,
      adminCreated: hasInitialAdmin,
      campaignCreated: company._count.campaigns > 0,
      integrationConfigured: Boolean(company.hrIntegration),
      firstResponseReceived: totalResponses > 0,
      completedSteps:
        1 +
        Number(hasInitialAdmin) +
        Number(company._count.campaigns > 0) +
        Number(Boolean(company.hrIntegration)) +
        Number(totalResponses > 0),
      totalSteps: 5,
      incomplete:
        !hasInitialAdmin ||
        company._count.campaigns === 0 ||
        !company.hrIntegration ||
        totalResponses === 0,
    };

    const lastSyncAt =
      company.hrIntegration?.lastSyncAt?.toISOString() ??
      company.hrIntegration?.updatedAt.toISOString() ??
      null;

    const lastActivityAt = [latestResponseAt, lastSyncAt, campaigns[0]?.createdAt ?? null, company.updatedAt.toISOString()]
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;

    const summary: ConsultantCompanySummary = {
      id: company.id,
      name: company.name,
      slug: company.slug,
      cnpj: company.cnpj,
      logoUrl: company.logoUrl,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
      tenantRole: payload.role === "OWNER" ? "OWNER" : roleByCompany.get(company.id) ?? "VIEWER",
      totalUsers: company._count.users,
      totalCampaigns: company._count.campaigns,
      totalResponses,
      activeCampaigns,
      unresolvedAlerts: unresolvedByCompany.get(company.id) ?? 0,
      openActionPlans: openPlansByCompany.get(company.id) ?? 0,
      linkedConsultants: company._count.consultants,
      hasInitialAdmin,
      hasActiveCampaign: activeCampaigns > 0,
      integrationConfigured: Boolean(company.hrIntegration),
      currentRiskLevel,
      latestResponseAt,
      lastSyncAt,
      lastActivityAt,
      onboarding,
      healthStatus: "WATCH",
      healthReason: "",
      campaignStatuses: [...new Set(campaigns.map((campaign) => campaign.status))],
      lastCampaign: campaigns[0] ?? null,
      campaigns,
    };

    const health = getHealth(summary);
    summary.healthStatus = health.status;
    summary.healthReason = health.reason;
    return summary;
  });
}

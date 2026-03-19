import { NextRequest, NextResponse } from "next/server";
import { requireConsultant } from "@/lib/consultor-auth";
import { getConsultantCompanySummaries } from "@/lib/consultor-companies";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const payload = await requireConsultant(req);
    const companyCards = await getConsultantCompanySummaries(payload);

    const totals = companyCards.reduce(
      (acc, company) => ({
        companies: acc.companies + 1,
        totalUsers: acc.totalUsers + company.totalUsers,
        totalCampaigns: acc.totalCampaigns + company.totalCampaigns,
        totalResponses: acc.totalResponses + company.totalResponses,
        activeCampaigns: acc.activeCampaigns + company.activeCampaigns,
        unresolvedAlerts: acc.unresolvedAlerts + company.unresolvedAlerts,
        openActionPlans: acc.openActionPlans + company.openActionPlans,
        onboardingIncomplete: acc.onboardingIncomplete + Number(company.onboarding.incomplete),
        criticalHealth: acc.criticalHealth + Number(company.healthStatus === "CRITICAL"),
      }),
      {
        companies: 0,
        totalUsers: 0,
        totalCampaigns: 0,
        totalResponses: 0,
        activeCampaigns: 0,
        unresolvedAlerts: 0,
        openActionPlans: 0,
        onboardingIncomplete: 0,
        criticalHealth: 0,
      }
    );

    return NextResponse.json({
      viewer: { id: payload.sub, role: payload.role },
      totals,
      companies: companyCards,
    });
  } catch (err: unknown) {
    if (err instanceof Error && ["UNAUTHORIZED", "FORBIDDEN", "FORBIDDEN_ROLE"].includes(err.message)) {
      return NextResponse.json(
        { error: err.message },
        { status: err.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

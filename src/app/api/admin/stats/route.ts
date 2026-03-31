import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, adminError } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    const [companies, campaigns, responses, consultants] = await Promise.all([
      prisma.company.count(),
      prisma.campaign.count(),
      prisma.response.count(),
      prisma.consultant.count(),
    ]);
    const activeCampaigns = await prisma.campaign.count({ where: { status: "ACTIVE" } });
    return NextResponse.json({ companies, campaigns, activeCampaigns, responses, consultants });
  } catch (err) {
    const { error, status } = adminError(err);
    return NextResponse.json({ error }, { status });
  }
}

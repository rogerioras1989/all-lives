import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.type !== "user") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        company: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    // Last campaign for company
    const lastActiveCampaign = await prisma.campaign.findFirst({
      where: { companyId: payload.companyId ?? "", status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    // Sector peers metrics from last campaign
    let sectorMetrics = null;
    if (user.sector && lastActiveCampaign) {
      const sectorResponses = await prisma.response.aggregate({
        where: { campaignId: lastActiveCampaign.id, sector: user.sector },
        _avg: { totalScore: true },
        _count: { id: true },
      });
      sectorMetrics = {
        campaignTitle: lastActiveCampaign.title,
        sector: user.sector,
        avgScore: sectorResponses._avg.totalScore ?? 0,
        totalResponses: sectorResponses._count.id,
      };
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        sector: user.sector,
        jobTitle: user.jobTitle,
        company: user.company,
      },
      responseMode: "ANONYMOUS",
      responseHistoryAvailable: false,
      responses: [],
      activeCampaign: lastActiveCampaign
        ? {
            id: lastActiveCampaign.id,
            title: lastActiveCampaign.title,
            slug: lastActiveCampaign.slug,
          }
        : null,
      sectorMetrics,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "UNKNOWN";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

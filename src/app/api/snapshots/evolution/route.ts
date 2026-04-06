import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, tenantError } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    
    // BUG-13: adicionar limite de paginação para evitar respostas enormes
    const url = new URL(req.url);
    const take = Math.min(Number(url.searchParams.get("take") ?? 100), 500);
    const skip = Math.max(Number(url.searchParams.get("skip") ?? 0), 0);

    const snapshots = await prisma.campaignSnapshot.findMany({
      where: {
        campaign: { companyId: ctx.companyId }
      },
      orderBy: { snapshotDate: "asc" },
      take,
      skip,
      select: {
        snapshotDate: true,
        topicScoresJson: true,
        overallScore: true,
        campaignId: true,
        campaign: { select: { title: true } }
      }
    });

    // Formatar para visualização de heatmap (Eixo X: Tempo, Eixo Y: Tópico, Valor: Score)
    const evolution: any[] = snapshots.map(snap => ({
      date: snap.snapshotDate,
      campaign: snap.campaign.title,
      overall: snap.overallScore,
      topics: snap.topicScoresJson
    }));

    return NextResponse.json(evolution);

  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

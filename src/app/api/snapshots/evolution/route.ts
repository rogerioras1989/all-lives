import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, tenantError } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    
    // Buscar todos os snapshots das campanhas da empresa
    const snapshots = await prisma.campaignSnapshot.findMany({
      where: {
        campaign: { companyId: ctx.companyId }
      },
      orderBy: { snapshotDate: "asc" },
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

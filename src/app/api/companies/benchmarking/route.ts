import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, tenantError } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    
    // Buscar o segmento da empresa atual
    const currentCompany = await prisma.company.findUnique({
      where: { id: ctx.companyId },
      select: { segment: true }
    });

    if (!currentCompany || !currentCompany.segment) {
      return NextResponse.json({ 
        message: "Segmento não definido para esta empresa.",
        data: null 
      });
    }

    // Buscar snapshots de outras empresas do mesmo segmento
    const snapshots = await prisma.campaignSnapshot.findMany({
      where: {
        campaign: {
          company: {
            segment: currentCompany.segment,
            // id: { not: ctx.companyId } // opcional: incluir ou não a própria empresa
          }
        }
      },
      orderBy: { snapshotDate: "desc" },
      distinct: ["campaignId"], // Apenas o snapshot mais recente de cada campanha
    });

    if (snapshots.length === 0) {
      return NextResponse.json({ 
        message: "Dados insuficientes para benchmarking no seu segmento.",
        data: null 
      });
    }

    // Agregar scores por tópico
    const topicAggregates: Record<number, { sum: number, count: number, name: string }> = {};

    snapshots.forEach((snap) => {
      const topicScores = snap.topicScoresJson as any[];
      if (Array.isArray(topicScores)) {
        topicScores.forEach((ts) => {
          if (!topicAggregates[ts.topicId]) {
            topicAggregates[ts.topicId] = { sum: 0, count: 0, name: ts.topicName };
          }
          topicAggregates[ts.topicId].sum += ts.score;
          topicAggregates[ts.topicId].count += 1;
        });
      }
    });

    const benchmarkingData = Object.entries(topicAggregates).map(([id, data]) => ({
      topicId: Number(id),
      topicName: data.name,
      averageScore: data.sum / data.count,
      sampleSize: data.count
    }));

    return NextResponse.json({
      segment: currentCompany.segment,
      benchmarking: benchmarkingData
    });

  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

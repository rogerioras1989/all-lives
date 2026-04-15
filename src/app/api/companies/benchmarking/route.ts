import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, tenantError } from "@/lib/tenant";

// BUG-2: mínimo de empresas para evitar exposição de dados individuais
const MIN_BENCHMARK_COMPANIES = 3;

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);

    const currentCompany = await prisma.company.findUnique({
      where: { id: ctx.companyId },
      select: { segment: true },
    });

    if (!currentCompany?.segment) {
      return NextResponse.json({
        message: "Segmento não definido para esta empresa.",
        data: null,
      });
    }

    // BUG-2: excluir a própria empresa do benchmarking
    const snapshots = await prisma.campaignSnapshot.findMany({
      where: {
        campaign: {
          company: {
            segment: currentCompany.segment,
            id: { not: ctx.companyId },
          },
        },
      },
      orderBy: { snapshotDate: "desc" },
      distinct: ["campaignId"],
    });

    // BUG-2: exigir mínimo de empresas distintas antes de liberar dados
    const distinctCompanies = new Set(snapshots.map((s) => s.campaignId));
    if (distinctCompanies.size < MIN_BENCHMARK_COMPANIES) {
      return NextResponse.json({
        message: "Dados insuficientes para benchmarking no seu segmento.",
        data: null,
      });
    }

    // BUG-12: média ponderada pelo count de respostas de cada snapshot
    // BUG-26: ler o campo correto `avgScore` (snapshot grava avgScore, não score)
    const topicAggregates: Record<number, { weightedSum: number; totalCount: number; name: string }> = {};

    type SnapshotTopicScore = { topicId: number; topicName: string; avgScore?: number };
    snapshots.forEach((snap) => {
      const topicScores = snap.topicScoresJson as unknown as SnapshotTopicScore[];
      if (!Array.isArray(topicScores)) return;
      const weight = snap.totalResponses > 0 ? snap.totalResponses : 1;
      topicScores.forEach((ts) => {
        // BUG-26: usar ts.avgScore em vez de ts.score
        const score = typeof ts.avgScore === "number" ? ts.avgScore : 0;
        if (!topicAggregates[ts.topicId]) {
          topicAggregates[ts.topicId] = { weightedSum: 0, totalCount: 0, name: ts.topicName };
        }
        topicAggregates[ts.topicId].weightedSum += score * weight;
        topicAggregates[ts.topicId].totalCount += weight;
      });
    });

    const benchmarkingData = Object.entries(topicAggregates).map(([id, data]) => ({
      topicId: Number(id),
      topicName: data.name,
      averageScore: data.totalCount > 0 ? data.weightedSum / data.totalCount : 0,
      sampleSize: snapshots.length,
    }));

    return NextResponse.json({
      segment: currentCompany.segment,
      benchmarking: benchmarkingData,
    });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

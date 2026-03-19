import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { DrpsReport } from "@/lib/pdf-report";
import {
  getTenantContext,
  requireCampaignOwnership,
  requireTenantAnalytics,
  tenantError,
} from "@/lib/tenant";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getRisk(score: number) {
  if (score <= 25) return "LOW";
  if (score <= 50) return "MEDIUM";
  if (score <= 75) return "HIGH";
  return "CRITICAL";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getTenantContext(req);
    await requireCampaignOwnership(id, ctx);
    requireTenantAnalytics(ctx);

    // fix #18 — use aggregation queries instead of loading all responses into memory
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        company: true,
        aiAnalyses: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!campaign) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

    const totalResponses = await prisma.response.count({ where: { campaignId: id } });
    if (totalResponses === 0) {
      return NextResponse.json({ error: "Sem respostas para gerar relatório" }, { status: 400 });
    }

    // aggregate topic scores via groupBy
    const [topicGroups, topicRiskGroups] = await Promise.all([
      prisma.topicScore.groupBy({
        by: ["topicId", "topicName"],
        where: { response: { campaignId: id } },
        _avg: { score: true },
      }),
      prisma.topicScore.groupBy({
        by: ["topicId", "riskLevel"],
        where: { response: { campaignId: id } },
        _count: { id: true },
      }),
    ]);

    const riskDistributionByTopic = topicRiskGroups.reduce<Record<number, Record<string, number>>>(
      (acc, group) => {
        acc[group.topicId] ??= { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
        acc[group.topicId][group.riskLevel] = group._count.id;
        return acc;
      },
      {}
    );

    const topicAverages = topicGroups.map((g) => ({
      topicId: g.topicId,
      topicName: g.topicName,
      averageScore: g._avg.score ?? 0,
      riskDistribution: riskDistributionByTopic[g.topicId] ?? { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
    }));

    // sector summary via groupBy on Response
    const sectorGroups = await prisma.response.groupBy({
      by: ["sector"],
      where: { campaignId: id, totalScore: { not: null } },
      _avg: { totalScore: true },
      _count: { totalScore: true },
    });
    const sectorSummary = sectorGroups.map((g) => ({
      sector: g.sector,
      count: g._count.totalScore,
      averageScore: g._avg.totalScore ?? 0,
    }));

    const overallAgg = await prisma.response.aggregate({
      where: { campaignId: id },
      _avg: { totalScore: true },
    });
    const overallAverage = overallAgg._avg.totalScore ?? 0;

    const generatedAt = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(DrpsReport as any, {
      data: {
        campaignTitle: campaign.title,
        companyName: campaign.company.name,
        generatedAt,
        totalResponses,
        overallAverage,
        overallRisk: getRisk(overallAverage),
        topicAverages,
        sectorSummary,
        aiAnalysis: campaign.aiAnalyses[0]?.result,
      },
    });

    const buffer = await renderToBuffer(element as Parameters<typeof renderToBuffer>[0]);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="DRPS-${campaign.slug}-${Date.now()}.pdf"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (err) {
    const { error, status } = tenantError(err);
    if (status !== 500) return NextResponse.json({ error }, { status });
    console.error("[pdf]", err instanceof Error ? err.message : "unknown"); // fix #19
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
}

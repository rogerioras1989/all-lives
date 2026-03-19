import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit-log";
import { slugify } from "@/lib/company-guardrails";
import { requireConsultantCompanyAccess } from "@/lib/consultor-auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { payload } = await requireConsultantCompanyAccess(req, id, { manage: true });
    const body = await req.json();
    const sourceCampaignId = String(body.sourceCampaignId ?? "").trim();
    const requestedTitle = String(body.title ?? "").trim();

    const sourceCampaign = sourceCampaignId
      ? await prisma.campaign.findFirst({
          where: {
            id: sourceCampaignId,
            companyId: id,
          },
        })
      : await prisma.campaign.findFirst({
          where: { companyId: id },
          orderBy: { createdAt: "desc" },
        });

    if (!sourceCampaign) {
      return NextResponse.json(
        { error: "Nenhuma campanha base encontrada para duplicar" },
        { status: 404 }
      );
    }

    const title = requestedTitle || `${sourceCampaign.title} (Cópia)`;
    const baseSlug = slugify(title) || `${slugify(sourceCampaign.slug)}-copia`;
    const existingCount = await prisma.campaign.count({
      where: {
        slug: { startsWith: baseSlug },
      },
    });
    const finalSlug = existingCount === 0 ? baseSlug : `${baseSlug}-${existingCount + 1}`;

    const campaign = await prisma.campaign.create({
      data: {
        title,
        description: sourceCampaign.description,
        status: "DRAFT",
        startDate: sourceCampaign.startDate,
        endDate: sourceCampaign.endDate,
        slug: finalSlug,
        companyId: id,
      },
    });

    await recordAuditLog(prisma, {
      companyId: id,
      action: "CAMPAIGN_CLONED",
      entityType: "Campaign",
      entityId: campaign.id,
      performedBy: payload.sub,
      metadata: {
        sourceCampaignId: sourceCampaign.id,
        sourceCampaignTitle: sourceCampaign.title,
        newCampaignTitle: campaign.title,
        newCampaignSlug: campaign.slug,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      ["UNAUTHORIZED", "FORBIDDEN", "FORBIDDEN_ROLE"].includes(err.message)
    ) {
      return NextResponse.json(
        { error: err.message },
        { status: err.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

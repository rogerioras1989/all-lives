import { NextRequest } from "next/server";
import { getAuthPayload } from "./middleware";
import { prisma } from "./prisma";

export interface TenantContext {
  userId: string;
  companyId: string;
  role: string;
  type: "user" | "consultant";
}

/**
 * Extracts the company context from the JWT.
 * - For users: companyId comes directly from the token
 * - For consultants: validates the requested companyId against ConsultantCompany (fix #1)
 * Throws descriptive errors on failure.
 */
export async function getTenantContext(req: NextRequest): Promise<TenantContext> {
  const payload = getAuthPayload(req);
  if (!payload) throw new Error("UNAUTHORIZED");

  if (payload.type === "user") {
    if (!payload.companyId) throw new Error("NO_COMPANY");
    return {
      userId: payload.sub,
      companyId: payload.companyId,
      role: payload.role,
      type: "user",
    };
  }

  // consultant — companyId must be provided via query or header
  const companyId =
    new URL(req.url).searchParams.get("companyId") ||
    req.headers.get("x-company-id");
  if (!companyId) throw new Error("COMPANY_REQUIRED");

  // fix #1 — validate that this consultant is actually linked to the requested company
  const link = await prisma.consultantCompany.findUnique({
    where: {
      consultantId_companyId: { consultantId: payload.sub, companyId },
    },
  });
  if (!link) throw new Error("FORBIDDEN");

  return {
    userId: payload.sub,
    companyId,
    role: payload.role,
    type: "consultant",
  };
}

/**
 * Verifies that a campaign belongs to the tenant's company.
 * Returns the campaign or throws "FORBIDDEN"/"NOT_FOUND".
 */
export async function requireCampaignOwnership(
  campaignId: string,
  ctx: TenantContext
) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) throw new Error("NOT_FOUND");

  if (ctx.type === "consultant") {
    // Verify consultant is linked to that company
    const link = await prisma.consultantCompany.findUnique({
      where: {
        consultantId_companyId: {
          consultantId: ctx.userId,
          companyId: campaign.companyId,
        },
      },
    });
    if (!link) throw new Error("FORBIDDEN");
    return campaign;
  }

  if (campaign.companyId !== ctx.companyId) throw new Error("FORBIDDEN");
  return campaign;
}

export function tenantError(err: unknown) {
  const msg = err instanceof Error ? err.message : "UNKNOWN";
  const map: Record<string, [string, number]> = {
    UNAUTHORIZED: ["Não autenticado", 401],
    NO_COMPANY: ["Usuário sem empresa associada", 403],
    COMPANY_REQUIRED: ["companyId obrigatório para consultores", 400],
    NOT_FOUND: ["Campanha não encontrada", 404],
    FORBIDDEN: ["Acesso negado a esta campanha", 403],
  };
  const [error, status] = map[msg] ?? ["Erro interno", 500];
  return { error, status };
}

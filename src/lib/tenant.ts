import { NextRequest } from "next/server";
import { getAuthPayload } from "./middleware";
import { prisma } from "./prisma";

export interface TenantContext {
  userId: string;
  companyId: string;
  role: string;
  type: "user" | "consultant";
  tenantRole?: string;
}

const COMPANY_ANALYTICS_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "HR", "MANAGER"]);
const COMPANY_MANAGEMENT_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "HR"]);

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

  if (payload.role === "OWNER") {
    return {
      userId: payload.sub,
      companyId,
      role: payload.role,
      type: "consultant",
      tenantRole: "OWNER",
    };
  }

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
    tenantRole: link.role,
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
    if (ctx.role === "OWNER") return campaign;
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

export function canViewTenantAnalytics(ctx: TenantContext): boolean {
  if (ctx.type === "consultant") return true;
  return COMPANY_ANALYTICS_ROLES.has(ctx.role);
}

export function canManageTenant(ctx: TenantContext): boolean {
  if (ctx.type === "consultant") {
    if (ctx.role === "ANALYST") return false;
    return !!ctx.tenantRole && ctx.tenantRole !== "VIEWER";
  }
  return COMPANY_MANAGEMENT_ROLES.has(ctx.role);
}

export function isManagerRestricted(ctx: TenantContext): boolean {
  return ctx.type === "user" && ctx.role === "MANAGER";
}

export function isPlatformOwner(ctx: Pick<TenantContext, "type" | "role">): boolean {
  return ctx.type === "consultant" && ctx.role === "OWNER";
}

export function requireTenantAnalytics(ctx: TenantContext): TenantContext {
  if (!canViewTenantAnalytics(ctx)) throw new Error("FORBIDDEN_ROLE");
  return ctx;
}

export function requireTenantManagement(ctx: TenantContext): TenantContext {
  if (!canManageTenant(ctx)) throw new Error("FORBIDDEN_ROLE");
  return ctx;
}

export function requireTenantCompanyMatch(
  ctx: TenantContext,
  companyId: string
): TenantContext {
  if (ctx.companyId !== companyId) throw new Error("FORBIDDEN");
  return ctx;
}

export function tenantError(err: unknown) {
  const msg = err instanceof Error ? err.message : "UNKNOWN";
  const map: Record<string, [string, number]> = {
    UNAUTHORIZED: ["Não autenticado", 401],
    NO_COMPANY: ["Usuário sem empresa associada", 403],
    COMPANY_REQUIRED: ["companyId obrigatório para consultores", 400],
    NOT_FOUND: ["Campanha não encontrada", 404],
    FORBIDDEN: ["Acesso negado a esta campanha", 403],
    FORBIDDEN_ROLE: ["Permissão insuficiente para esta ação", 403],
  };
  const [error, status] = map[msg] ?? ["Erro interno", 500];
  return { error, status };
}

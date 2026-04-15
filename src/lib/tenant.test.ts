import { describe, it, expect } from "vitest";
import {
  canManageTenant,
  canViewTenantAnalytics,
  isManagerRestricted,
  isPlatformOwner,
  requireTenantAnalytics,
  requireTenantCompanyMatch,
  requireTenantManagement,
  tenantError,
  type TenantContext,
} from "./tenant";

const baseUserCtx = (overrides: Partial<TenantContext> = {}): TenantContext => ({
  userId: "u1",
  companyId: "c1",
  role: "EMPLOYEE",
  type: "user",
  ...overrides,
});

const baseConsultantCtx = (overrides: Partial<TenantContext> = {}): TenantContext => ({
  userId: "k1",
  companyId: "c1",
  role: "CONSULTANT",
  type: "consultant",
  tenantRole: "VIEWER",
  ...overrides,
});

describe("canViewTenantAnalytics", () => {
  it("permite todos os consultores", () => {
    expect(canViewTenantAnalytics(baseConsultantCtx())).toBe(true);
    expect(canViewTenantAnalytics(baseConsultantCtx({ role: "ANALYST" }))).toBe(true);
    expect(canViewTenantAnalytics(baseConsultantCtx({ role: "OWNER" }))).toBe(true);
  });

  it("permite usuários OWNER, ADMIN, HR e MANAGER", () => {
    expect(canViewTenantAnalytics(baseUserCtx({ role: "OWNER" }))).toBe(true);
    expect(canViewTenantAnalytics(baseUserCtx({ role: "ADMIN" }))).toBe(true);
    expect(canViewTenantAnalytics(baseUserCtx({ role: "HR" }))).toBe(true);
    expect(canViewTenantAnalytics(baseUserCtx({ role: "MANAGER" }))).toBe(true);
  });

  it("nega EMPLOYEE", () => {
    expect(canViewTenantAnalytics(baseUserCtx({ role: "EMPLOYEE" }))).toBe(false);
  });
});

describe("canManageTenant", () => {
  it("nega consultores ANALYST", () => {
    expect(canManageTenant(baseConsultantCtx({ role: "ANALYST" }))).toBe(false);
  });

  it("nega consultores VIEWER no tenant", () => {
    expect(canManageTenant(baseConsultantCtx({ tenantRole: "VIEWER" }))).toBe(false);
  });

  it("permite consultor com tenantRole != VIEWER", () => {
    expect(canManageTenant(baseConsultantCtx({ tenantRole: "EDITOR" }))).toBe(true);
  });

  it("permite usuários OWNER/ADMIN/HR", () => {
    expect(canManageTenant(baseUserCtx({ role: "OWNER" }))).toBe(true);
    expect(canManageTenant(baseUserCtx({ role: "ADMIN" }))).toBe(true);
    expect(canManageTenant(baseUserCtx({ role: "HR" }))).toBe(true);
  });

  it("nega MANAGER e EMPLOYEE para gestão", () => {
    expect(canManageTenant(baseUserCtx({ role: "MANAGER" }))).toBe(false);
    expect(canManageTenant(baseUserCtx({ role: "EMPLOYEE" }))).toBe(false);
  });
});

describe("isManagerRestricted", () => {
  it("é true apenas para usuário com role MANAGER", () => {
    expect(isManagerRestricted(baseUserCtx({ role: "MANAGER" }))).toBe(true);
    expect(isManagerRestricted(baseUserCtx({ role: "ADMIN" }))).toBe(false);
    expect(isManagerRestricted(baseConsultantCtx({ role: "MANAGER" }))).toBe(false);
  });
});

describe("isPlatformOwner", () => {
  it("é true só para consultor OWNER", () => {
    expect(isPlatformOwner({ type: "consultant", role: "OWNER" })).toBe(true);
    expect(isPlatformOwner({ type: "consultant", role: "ANALYST" })).toBe(false);
    expect(isPlatformOwner({ type: "user", role: "OWNER" })).toBe(false);
  });
});

describe("requireTenantAnalytics", () => {
  it("retorna o ctx quando autorizado", () => {
    const ctx = baseUserCtx({ role: "ADMIN" });
    expect(requireTenantAnalytics(ctx)).toBe(ctx);
  });

  it("lança FORBIDDEN_ROLE quando não autorizado", () => {
    expect(() => requireTenantAnalytics(baseUserCtx({ role: "EMPLOYEE" }))).toThrow(
      "FORBIDDEN_ROLE"
    );
  });
});

describe("requireTenantManagement", () => {
  it("lança FORBIDDEN_ROLE para MANAGER de empresa", () => {
    expect(() => requireTenantManagement(baseUserCtx({ role: "MANAGER" }))).toThrow(
      "FORBIDDEN_ROLE"
    );
  });
});

describe("requireTenantCompanyMatch", () => {
  it("aceita quando companyId bate", () => {
    const ctx = baseUserCtx({ companyId: "c1" });
    expect(requireTenantCompanyMatch(ctx, "c1")).toBe(ctx);
  });

  it("lança FORBIDDEN quando companyId difere", () => {
    expect(() => requireTenantCompanyMatch(baseUserCtx({ companyId: "c1" }), "c2")).toThrow(
      "FORBIDDEN"
    );
  });
});

describe("tenantError", () => {
  it("mapeia erros conhecidos para status correto", () => {
    expect(tenantError(new Error("UNAUTHORIZED"))).toEqual({
      error: "Não autenticado",
      status: 401,
    });
    expect(tenantError(new Error("NOT_FOUND"))).toEqual({
      error: "Campanha não encontrada",
      status: 404,
    });
    expect(tenantError(new Error("FORBIDDEN"))).toEqual({
      error: "Acesso negado a esta campanha",
      status: 403,
    });
    expect(tenantError(new Error("FORBIDDEN_ROLE"))).toEqual({
      error: "Permissão insuficiente para esta ação",
      status: 403,
    });
  });

  it("retorna 500 para erros desconhecidos", () => {
    expect(tenantError(new Error("ALGO_INESPERADO"))).toEqual({
      error: "Erro interno",
      status: 500,
    });
  });
});

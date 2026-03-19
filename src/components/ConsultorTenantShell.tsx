"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { SidebarShell } from "@/components/SidebarShell";

type TenantCompany = {
  id: string;
  name: string;
  cnpj: string | null;
  totalUsers: number;
  totalCampaigns: number;
  totalAlerts: number;
  totalActionPlans: number;
  campaigns?: {
    id: string;
    title: string;
    status: string;
    slug: string;
    createdAt: string;
  }[];
};

type CompaniesPayload = {
  viewer?: { id: string; role: string };
  companies?: TenantCompany[];
};

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner da plataforma",
  CONSULTANT: "Consultor All Lives",
  ANALYST: "Analista All Lives",
};

export function useConsultorTenantData(tenantId: string) {
  const [viewerRole, setViewerRole] = useState("CONSULTANT");
  const [company, setCompany] = useState<TenantCompany | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/consultor/companies")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: CompaniesPayload | null) => {
        if (!active || !payload) return;
        if (payload.viewer?.role) setViewerRole(payload.viewer.role);
        const currentCompany = payload.companies?.find((item) => item.id === tenantId) ?? null;
        setCompany(currentCompany);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [tenantId]);

  return {
    company,
    viewerRole,
    viewerRoleLabel: ROLE_LABEL[viewerRole] ?? viewerRole,
    readOnly: viewerRole === "ANALYST",
    defaultCampaignId: company?.campaigns?.[0]?.id ?? null,
  };
}

type ConsultorTenantShellProps = {
  tenantId: string;
  company?: TenantCompany | null;
  viewerRoleLabel?: string;
  readOnly?: boolean;
  actions?: ReactNode;
  children: ReactNode;
};

export function ConsultorTenantShell({
  tenantId,
  company: companyProp,
  viewerRoleLabel: viewerRoleLabelProp,
  readOnly: readOnlyProp,
  actions,
  children,
}: ConsultorTenantShellProps) {
  const tenantData = useConsultorTenantData(tenantId);
  const company = companyProp ?? tenantData.company;
  const viewerRoleLabel = viewerRoleLabelProp ?? tenantData.viewerRoleLabel;
  const readOnly = readOnlyProp ?? tenantData.readOnly;

  const subtitle = useMemo(() => {
    if (!company) {
      return "Painel operacional do tenant com analytics anônimo, auditoria e integrações.";
    }

    const parts = [
      `${company.totalUsers} usuário(s)`,
      `${company.totalCampaigns} campanha(s)`,
      `${company.totalAlerts} alerta(s)`,
      `${company.totalActionPlans} plano(s)`,
    ];

    if (company.cnpj) parts.unshift(company.cnpj);
    return parts.join(" · ");
  }, [company]);

  return (
    <SidebarShell
      badge="Tenant Cliente"
      title={company?.name ?? "Tenant"}
      subtitle={subtitle}
      userName="Equipe All Lives"
      userRole={viewerRoleLabel}
      nav={[
        { href: "/consultor", label: "Visão global", icon: "🌐" },
        { href: `/consultor/empresas/${tenantId}`, label: "Painel do tenant", icon: "🏢" },
        { href: `/consultor/empresas/${tenantId}/auditoria`, label: "Auditoria", icon: "📋" },
        { href: `/consultor/empresas/${tenantId}/integracao`, label: "Integração RH", icon: "🔗", disabled: readOnly },
        { href: `/consultor/empresas/${tenantId}/importar`, label: "Importar usuários", icon: "📤", disabled: readOnly },
      ]}
      actions={
        <>
          <Link href="/consultor" className="btn-ghost text-xs px-3 py-2">
            ← Carteira
          </Link>
          {actions}
        </>
      }
    >
      {children}
    </SidebarShell>
  );
}

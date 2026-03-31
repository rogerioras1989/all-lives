"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ConsultorTenantShell, useConsultorTenantData } from "@/components/ConsultorTenantShell";

type Campaign = {
  id: string;
  title: string;
  status: string;
  slug: string;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
  responseCount: number;
};

type CompanySummary = {
  id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  logoUrl: string | null;
  totalUsers: number;
  totalCampaigns: number;
  totalResponses: number;
  activeCampaigns: number;
  unresolvedAlerts: number;
  openActionPlans: number;
  currentRiskLevel: string | null;
  latestResponseAt: string | null;
  lastSyncAt: string | null;
  lastActivityAt: string | null;
  healthStatus: "HEALTHY" | "WATCH" | "CRITICAL";
  healthReason: string;
  hasInitialAdmin: boolean;
  integrationConfigured: boolean;
  hasActiveCampaign: boolean;
  onboarding: {
    companyCreated: boolean;
    adminCreated: boolean;
    campaignCreated: boolean;
    integrationConfigured: boolean;
    firstResponseReceived: boolean;
    completedSteps: number;
    totalSteps: number;
    incomplete: boolean;
  };
  campaigns: Campaign[];
};

type LinkItem = {
  consultantId: string;
  tenantRole: string;
  linkedAt: string;
  consultant: {
    id: string;
    name: string;
    email: string;
    globalRole: string;
    lastLoginAt: string | null;
  };
};

type LinksPayload = {
  links: LinkItem[];
  viewer?: {
    id: string;
    role: string;
    tenantRole: string;
  };
};

const HEALTH_COLOR = {
  HEALTHY: "#3d8a50",
  WATCH: "#b45309",
  CRITICAL: "#dc2626",
} as const;

const HEALTH_LABEL = {
  HEALTHY: "Saudável",
  WATCH: "Atenção",
  CRITICAL: "Crítico",
} as const;

const RISK_LABEL: Record<string, string> = {
  LOW: "Baixo",
  MEDIUM: "Moderado",
  HIGH: "Alto",
  CRITICAL: "Crítico",
};

function formatDate(value: string | null) {
  if (!value) return "Sem registro";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TenantGestaoPage() {
  const { id } = useParams<{ id: string }>();
  const tenantData = useConsultorTenantData(id);
  const [company, setCompany] = useState<CompanySummary | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [profileError, setProfileError] = useState("");
  const [linkError, setLinkError] = useState("");
  const [cloneError, setCloneError] = useState("");
  const [profileForm, setProfileForm] = useState({
    name: "",
    cnpj: "",
    slug: "",
    logoUrl: "",
  });
  const [linkForm, setLinkForm] = useState({
    email: "",
    role: "VIEWER",
  });
  const [cloning, setCloning] = useState(false);
  const [cloneForm, setCloneForm] = useState({
    sourceCampaignId: "",
    title: "",
  });
  const { readOnly } = tenantData;

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [companyResponse, linksResponse] = await Promise.all([
          fetch(`/api/consultor/companies/${id}`),
          fetch(`/api/consultor/companies/${id}/links`),
        ]);

        const companyPayload = await companyResponse.json();
        const linksPayload: LinksPayload = await linksResponse.json();

        if (companyResponse.ok) {
          setCompany(companyPayload.company ?? null);
          setProfileForm({
            name: companyPayload.company?.name ?? "",
            cnpj: companyPayload.company?.cnpj ?? "",
            slug: companyPayload.company?.slug ?? "",
            logoUrl: companyPayload.company?.logoUrl ?? "",
          });
          setCloneForm((current) => ({
            ...current,
            sourceCampaignId: current.sourceCampaignId || companyPayload.company?.campaigns?.[0]?.id || "",
          }));
        }

        if (linksResponse.ok) {
          setLinks(linksPayload.links ?? []);
        }
      } finally {
        setLoading(false);
      }
    }

    void loadAll();
  }, [id]);

  const onboardingSteps = useMemo(() => {
    if (!company) return [];
    return [
      { label: "Empresa cadastrada", done: company.onboarding.companyCreated },
      { label: "Admin inicial", done: company.onboarding.adminCreated },
      { label: "Avaliação inicial", done: company.onboarding.campaignCreated },
      { label: "Integração RH", done: company.onboarding.integrationConfigured },
      { label: "Primeira resposta", done: company.onboarding.firstResponseReceived },
    ];
  }, [company]);

  async function reloadCompany() {
    const response = await fetch(`/api/consultor/companies/${id}`);
    const payload = await response.json();
    if (response.ok) {
      setCompany(payload.company ?? null);
      setProfileForm({
        name: payload.company?.name ?? "",
        cnpj: payload.company?.cnpj ?? "",
        slug: payload.company?.slug ?? "",
        logoUrl: payload.company?.logoUrl ?? "",
      });
    }
  }

  async function saveProfile() {
    setSaveState("saving");
    setProfileError("");
    const response = await fetch(`/api/consultor/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    });
    const payload = await response.json();
    if (!response.ok) {
      if (payload.suggestedSlug) {
        setProfileForm((current) => ({ ...current, slug: payload.suggestedSlug }));
      }
      setProfileError(payload.error ?? "Não foi possível salvar o tenant.");
      setSaveState("idle");
      return;
    }
    setCompany(payload.summary ?? payload.company ?? null);
    setSaveState("saved");
    window.setTimeout(() => setSaveState("idle"), 1800);
  }

  async function addLink() {
    setLinkError("");
    const response = await fetch(`/api/consultor/companies/${id}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(linkForm),
    });
    const payload = await response.json();
    if (!response.ok) {
      setLinkError(payload.error ?? "Não foi possível adicionar o vínculo.");
      return;
    }
    setLinkForm({ email: "", role: "VIEWER" });
    setLinks(payload.links ?? []);
  }

  async function updateLink(consultantId: string, role: string) {
    setLinkError("");
    const response = await fetch(`/api/consultor/companies/${id}/links`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consultantId, role }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setLinkError(payload.error ?? "Não foi possível atualizar o vínculo.");
      return;
    }
    setLinks(payload.links ?? []);
  }

  async function removeLink(consultantId: string) {
    setLinkError("");
    const response = await fetch(`/api/consultor/companies/${id}/links`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consultantId }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setLinkError(payload.error ?? "Não foi possível remover o vínculo.");
      return;
    }
    setLinks(payload.links ?? []);
  }

  async function cloneCampaign() {
    if (!cloneForm.sourceCampaignId) {
      setCloneError("Selecione uma avaliação base para duplicar.");
      return;
    }

    setCloneError("");
    setCloning(true);

    try {
      const response = await fetch(`/api/consultor/companies/${id}/clone-campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cloneForm),
      });
      const payload = await response.json();
      if (!response.ok) {
        setCloneError(payload.error ?? "Não foi possível duplicar a avaliação.");
        return;
      }
      await reloadCompany();
      setCloneForm((current) => ({
        ...current,
        title: "",
        sourceCampaignId: payload.campaign?.id ?? current.sourceCampaignId,
      }));
    } finally {
      setCloning(false);
    }
  }

  if (loading) {
    return (
      <ConsultorTenantShell tenantId={id}>
        <div className="mx-auto max-w-5xl">
          <div className="card-3d-sm p-8 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "#2e7fa3", borderTopColor: "transparent" }} />
          </div>
        </div>
      </ConsultorTenantShell>
    );
  }

  return (
    <ConsultorTenantShell
      tenantId={id}
      company={company ?? tenantData.company}
      viewerRoleLabel={tenantData.viewerRoleLabel}
      readOnly={tenantData.readOnly}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {readOnly && (
          <div className="card-3d-sm p-4 fade-up flex items-start gap-3"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)" }}>
            <span className="text-xl">👁</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#9a6700" }}>Modo somente leitura</p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: "#7a6a4a" }}>
                Analistas podem inspecionar o progresso e vínculos existentes, mas não podem editar empresa, gerenciar acessos ou duplicar avaliações.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="card-3d-sm p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "#2e7fa3" }}>Onboarding</p>
                <h2 className="mt-1 text-lg font-semibold" style={{ color: "#1e3a4a" }}>
                  {company?.onboarding.completedSteps ?? 0}/{company?.onboarding.totalSteps ?? 5} marcos concluídos
                </h2>
              </div>
              <span className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: "rgba(46,127,163,0.08)", color: "#1e5f7a" }}>
                {Math.round((((company?.onboarding.completedSteps ?? 0) / (company?.onboarding.totalSteps ?? 5)) || 0) * 100)}%
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ background: "rgba(91,158,201,0.12)" }}>
              <div
                style={{
                  width: `${(((company?.onboarding.completedSteps ?? 0) / (company?.onboarding.totalSteps ?? 5)) || 0) * 100}%`,
                  height: "100%",
                  background: "linear-gradient(135deg,#2e7fa3,#5baa6d)",
                }}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {onboardingSteps.map((step) => (
                <span
                  key={step.label}
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    background: step.done ? "rgba(91,170,109,0.12)" : "rgba(245,158,11,0.12)",
                    color: step.done ? "#3d8a50" : "#b45309",
                  }}
                >
                  {step.done ? "✓" : "•"} {step.label}
                </span>
              ))}
            </div>
          </div>

          <div className="card-3d-sm p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "#2e7fa3" }}>Saúde operacional</p>
                <h2 className="mt-1 text-lg font-semibold" style={{ color: "#1e3a4a" }}>
                  {company ? HEALTH_LABEL[company.healthStatus] : "Sem dado"}
                </h2>
              </div>
              {company && (
                <span className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: `${HEALTH_COLOR[company.healthStatus]}18`,
                    color: HEALTH_COLOR[company.healthStatus],
                  }}>
                  {HEALTH_LABEL[company.healthStatus]}
                </span>
              )}
            </div>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "#5a7a8a" }}>
              {company?.healthReason ?? "Sem resumo operacional disponível."}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs" style={{ color: "#5a7a8a" }}>
              <p>Risco atual: <strong style={{ color: "#1e3a4a" }}>{company?.currentRiskLevel ? RISK_LABEL[company.currentRiskLevel] : "Sem base"}</strong></p>
              <p>Última atividade: <strong style={{ color: "#1e3a4a" }}>{formatDate(company?.lastActivityAt ?? null)}</strong></p>
              <p>Última sincronização RH: <strong style={{ color: "#1e3a4a" }}>{formatDate(company?.lastSyncAt ?? null)}</strong></p>
              <p>Última resposta: <strong style={{ color: "#1e3a4a" }}>{formatDate(company?.latestResponseAt ?? null)}</strong></p>
            </div>
          </div>
        </div>

        <div className="card-3d-sm p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>Dados da empresa</h2>
              <p className="mt-1 text-xs" style={{ color: "#7a9aaa" }}>
                Atualize dados cadastrais, logo e slug com validações de CNPJ, duplicidade e conflito de slug.
              </p>
            </div>
            {!readOnly && (
              <button
                type="button"
                className="btn-primary text-xs px-4 py-2"
                onClick={saveProfile}
                disabled={saveState === "saving"}
              >
                {saveState === "saving" ? "Salvando..." : saveState === "saved" ? "Salvo" : "Salvar dados"}
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-xs font-medium" style={{ color: "#5a7a8a" }}>
              Nome da empresa
              <input
                type="text"
                value={profileForm.name}
                onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                disabled={readOnly}
                className="mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none"
                style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
              />
            </label>
            <label className="text-xs font-medium" style={{ color: "#5a7a8a" }}>
              CNPJ
              <input
                type="text"
                value={profileForm.cnpj}
                onChange={(event) => setProfileForm((current) => ({ ...current, cnpj: event.target.value }))}
                disabled={readOnly}
                className="mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none"
                style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
              />
            </label>
            <label className="text-xs font-medium" style={{ color: "#5a7a8a" }}>
              Slug
              <input
                type="text"
                value={profileForm.slug}
                onChange={(event) => setProfileForm((current) => ({ ...current, slug: event.target.value }))}
                disabled={readOnly}
                className="mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none"
                style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
              />
            </label>
            <label className="text-xs font-medium" style={{ color: "#5a7a8a" }}>
              URL da logo
              <input
                type="url"
                value={profileForm.logoUrl}
                onChange={(event) => setProfileForm((current) => ({ ...current, logoUrl: event.target.value }))}
                disabled={readOnly}
                className="mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none"
                style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
              />
            </label>
          </div>

          {profileError && (
            <div className="mt-4 rounded-2xl px-4 py-3 text-xs"
              style={{ background: "rgba(220,38,38,0.08)", color: "#b91c1c", border: "1px solid rgba(220,38,38,0.12)" }}>
              {profileError}
            </div>
          )}
        </div>

        <div className="card-3d-sm p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>Acesso All Lives</h2>
              <p className="mt-1 text-xs" style={{ color: "#7a9aaa" }}>
                Vincule consultores e analistas existentes por e-mail. As ações ficam registradas na auditoria.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {links.map((link) => (
              <div
                key={link.consultantId}
                className="rounded-2xl border p-4"
                style={{ borderColor: "rgba(91,158,201,0.12)", background: "rgba(91,158,201,0.04)" }}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>{link.consultant.name}</p>
                    <p className="mt-1 text-xs" style={{ color: "#7a9aaa" }}>
                      {link.consultant.email} · papel global {link.consultant.globalRole} · último login {formatDate(link.consultant.lastLoginAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={link.tenantRole}
                      onChange={(event) => void updateLink(link.consultantId, event.target.value)}
                      disabled={readOnly}
                      className="rounded-xl border px-3 py-2 text-xs outline-none"
                      style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                    {!readOnly && (
                      <button
                        type="button"
                        className="btn-ghost text-xs px-3 py-2"
                        onClick={() => void removeLink(link.consultantId)}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_180px_auto]">
            <label className="text-xs font-medium" style={{ color: "#5a7a8a" }}>
              E-mail do consultor
              <input
                type="email"
                value={linkForm.email}
                onChange={(event) => setLinkForm((current) => ({ ...current, email: event.target.value }))}
                disabled={readOnly}
                className="mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none"
                style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
                placeholder="consultor@alllives.com.br"
              />
            </label>
            <label className="text-xs font-medium" style={{ color: "#5a7a8a" }}>
              Papel
              <select
                value={linkForm.role}
                onChange={(event) => setLinkForm((current) => ({ ...current, role: event.target.value }))}
                disabled={readOnly}
                className="mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none"
                style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
              >
                <option value="VIEWER">VIEWER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
            {!readOnly && (
              <button
                type="button"
                className="btn-primary text-xs px-4 py-2 self-end"
                onClick={addLink}
              >
                Vincular consultor
              </button>
            )}
          </div>

          {linkError && (
            <div className="mt-4 rounded-2xl px-4 py-3 text-xs"
              style={{ background: "rgba(220,38,38,0.08)", color: "#b91c1c", border: "1px solid rgba(220,38,38,0.12)" }}>
              {linkError}
            </div>
          )}
        </div>

        <div className="card-3d-sm p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>Duplicar avaliação</h2>
              <p className="mt-1 text-xs" style={{ color: "#7a9aaa" }}>
                Crie uma nova avaliação a partir de uma existente, preservando a estrutura operacional.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <label className="text-xs font-medium" style={{ color: "#5a7a8a" }}>
              Avaliação base
              <select
                value={cloneForm.sourceCampaignId}
                onChange={(event) => setCloneForm((current) => ({ ...current, sourceCampaignId: event.target.value }))}
                disabled={readOnly || (company?.campaigns.length ?? 0) === 0}
                className="mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none"
                style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
              >
                <option value="">Selecione</option>
                {(company?.campaigns ?? []).map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title} · {campaign.status}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium" style={{ color: "#5a7a8a" }}>
              Título da nova avaliação
              <input
                type="text"
                value={cloneForm.title}
                onChange={(event) => setCloneForm((current) => ({ ...current, title: event.target.value }))}
                disabled={readOnly}
                className="mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none"
                style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
                placeholder="Opcional. Se vazio, será gerada uma cópia"
              />
            </label>
            {!readOnly && (
              <button
                type="button"
                className="btn-primary text-xs px-4 py-2 self-end"
                onClick={cloneCampaign}
                disabled={cloning || (company?.campaigns.length ?? 0) === 0}
              >
                {cloning ? "Duplicando..." : "Duplicar avaliação"}
              </button>
            )}
          </div>

          {(company?.campaigns.length ?? 0) > 0 && (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {company?.campaigns.slice(0, 4).map((campaign) => (
                <div key={campaign.id} className="rounded-2xl border p-4"
                  style={{ borderColor: "rgba(91,158,201,0.12)", background: "rgba(91,158,201,0.04)" }}>
                  <p className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>{campaign.title}</p>
                  <p className="mt-1 text-xs" style={{ color: "#7a9aaa" }}>
                    {campaign.status} · {campaign.responseCount} resposta(s) · {formatDate(campaign.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {cloneError && (
            <div className="mt-4 rounded-2xl px-4 py-3 text-xs"
              style={{ background: "rgba(220,38,38,0.08)", color: "#b91c1c", border: "1px solid rgba(220,38,38,0.12)" }}>
              {cloneError}
            </div>
          )}
        </div>
      </div>
    </ConsultorTenantShell>
  );
}

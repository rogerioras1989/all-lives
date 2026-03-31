"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SidebarShell } from "@/components/SidebarShell";

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

type CompanyCard = {
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
  campaignStatuses: string[];
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
  lastCampaign: Campaign | null;
  campaigns: Campaign[];
};

type OverviewData = {
  viewer: { id: string; role: string };
  totals: {
    companies: number;
    totalUsers: number;
    totalCampaigns: number;
    totalResponses: number;
    activeCampaigns: number;
    unresolvedAlerts: number;
    openActionPlans: number;
    onboardingIncomplete: number;
    criticalHealth: number;
  };
  companies: CompanyCard[];
};

type BinaryFilter = "ALL" | "YES" | "NO";
type ActivityFilter = "ALL" | "NONE" | "LAST_7_DAYS" | "LAST_30_DAYS" | "STALE";
type ResponseRangeFilter = "ALL" | "0" | "1_10" | "11_50" | "51_PLUS";
type SortOption = "NAME" | "RESPONSES" | "RECENT_ACTIVITY" | "RISK" | "ONBOARDING";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativa",
  CLOSED: "Encerrada",
  ARCHIVED: "Arquivada",
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "#7a9aaa",
  ACTIVE: "#5baa6d",
  CLOSED: "#f59e0b",
  ARCHIVED: "#9ca3af",
};

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner da plataforma",
  CONSULTANT: "Consultor All Lives",
  ANALYST: "Analista All Lives",
};

const HEALTH_LABEL: Record<CompanyCard["healthStatus"], string> = {
  HEALTHY: "Saudável",
  WATCH: "Atenção",
  CRITICAL: "Crítico",
};

const HEALTH_COLOR: Record<CompanyCard["healthStatus"], string> = {
  HEALTHY: "#3d8a50",
  WATCH: "#b45309",
  CRITICAL: "#dc2626",
};

const RISK_LABEL: Record<string, string> = {
  LOW: "Baixo",
  MEDIUM: "Moderado",
  HIGH: "Alto",
  CRITICAL: "Crítico",
};

const RISK_ORDER: Record<string, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

const initialCreateForm = {
  name: "",
  cnpj: "",
};

function matchesBinaryFilter(value: boolean, filter: BinaryFilter) {
  if (filter === "ALL") return true;
  return filter === "YES" ? value : !value;
}

function matchesResponseRange(totalResponses: number, filter: ResponseRangeFilter) {
  if (filter === "ALL") return true;
  if (filter === "0") return totalResponses === 0;
  if (filter === "1_10") return totalResponses >= 1 && totalResponses <= 10;
  if (filter === "11_50") return totalResponses >= 11 && totalResponses <= 50;
  return totalResponses > 50;
}

function matchesActivity(lastActivityAt: string | null, filter: ActivityFilter) {
  if (filter === "ALL") return true;
  if (!lastActivityAt) return filter === "NONE";

  const ageDays = (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24);
  if (filter === "LAST_7_DAYS") return ageDays <= 7;
  if (filter === "LAST_30_DAYS") return ageDays <= 30;
  if (filter === "STALE") return ageDays > 30;
  return false;
}

function formatDate(value: string | null) {
  if (!value) return "Sem registro";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getOnboardingSteps(company: CompanyCard) {
  return [
    { label: "Empresa", done: company.onboarding.companyCreated },
    { label: "Admin", done: company.onboarding.adminCreated },
    { label: "Avaliação", done: company.onboarding.campaignCreated },
    { label: "Integração RH", done: company.onboarding.integrationConfigured },
    { label: "1ª resposta", done: company.onboarding.firstResponseReceived },
  ];
}

export default function ConsultorPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("NAME");
  const [campaignStatusFilter, setCampaignStatusFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [onlyIncompleteOnboarding, setOnlyIncompleteOnboarding] = useState(false);
  const [adminFilter, setAdminFilter] = useState<BinaryFilter>("ALL");
  const [integrationFilter, setIntegrationFilter] = useState<BinaryFilter>("ALL");
  const [activeCampaignFilter, setActiveCampaignFilter] = useState<BinaryFilter>("ALL");
  const [responseRangeFilter, setResponseRangeFilter] = useState<ResponseRangeFilter>("ALL");
  const [alertsFilter, setAlertsFilter] = useState<BinaryFilter>("ALL");
  const [planFilter, setPlanFilter] = useState<BinaryFilter>("ALL");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("ALL");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState(initialCreateForm);

  useEffect(() => {
    fetch("/api/consultor/overview")
      .then((response) => {
        if (response.status === 401 || response.status === 403) {
          router.push("/consultor/login");
          return null;
        }
        return response.json();
      })
      .then((payload) => {
        if (payload) setData(payload);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  async function refreshOverview() {
    const response = await fetch("/api/consultor/overview");
    if (response.status === 401 || response.status === 403) {
      router.push("/consultor/login");
      return;
    }
    const payload = await response.json();
    setData(payload);
  }

  async function createCompany() {
    if (!createForm.name.trim()) {
      setCreateError("Informe o nome da empresa.");
      return;
    }

    setCreatingCompany(true);
    setCreateError("");

    try {
      const response = await fetch("/api/consultor/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const payload = await response.json();

      if (!response.ok) {
        setCreateError(payload.error ?? "Não foi possível cadastrar a empresa.");
        return;
      }

      await refreshOverview();
      setShowCreateForm(false);
      setCreateForm(initialCreateForm);
      router.push(
        `/consultor/empresas/${payload.company.id}${payload.campaign ? `?campaign=${payload.campaign.id}` : ""}`
      );
    } finally {
      setCreatingCompany(false);
    }
  }

  const filteredCompanies = useMemo(() => {
    const items = [...(data?.companies ?? [])]
      .filter((company) => {
        const term = search.trim().toLowerCase();
        if (!term) return true;
        return [company.name, company.slug, company.cnpj ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .filter((company) => (
        campaignStatusFilter === "ALL" || company.campaignStatuses.includes(campaignStatusFilter)
      ))
      .filter((company) => riskFilter === "ALL" || company.currentRiskLevel === riskFilter)
      .filter((company) => !onlyIncompleteOnboarding || company.onboarding.incomplete)
      .filter((company) => matchesBinaryFilter(company.hasInitialAdmin, adminFilter))
      .filter((company) => matchesBinaryFilter(company.integrationConfigured, integrationFilter))
      .filter((company) => matchesBinaryFilter(company.hasActiveCampaign, activeCampaignFilter))
      .filter((company) => matchesResponseRange(company.totalResponses, responseRangeFilter))
      .filter((company) => matchesBinaryFilter(company.unresolvedAlerts > 0, alertsFilter))
      .filter((company) => matchesBinaryFilter(company.openActionPlans > 0, planFilter))
      .filter((company) => matchesActivity(company.lastActivityAt, activityFilter));

    items.sort((left, right) => {
      if (sortBy === "RESPONSES") return right.totalResponses - left.totalResponses;
      if (sortBy === "RECENT_ACTIVITY") {
        return (
          new Date(right.lastActivityAt ?? 0).getTime() -
          new Date(left.lastActivityAt ?? 0).getTime()
        );
      }
      if (sortBy === "RISK") {
        return (RISK_ORDER[right.currentRiskLevel ?? "LOW"] ?? 0) - (RISK_ORDER[left.currentRiskLevel ?? "LOW"] ?? 0);
      }
      if (sortBy === "ONBOARDING") {
        return left.onboarding.completedSteps - right.onboarding.completedSteps;
      }
      return left.name.localeCompare(right.name, "pt-BR");
    });

    return items;
  }, [
    activeCampaignFilter,
    activityFilter,
    adminFilter,
    alertsFilter,
    campaignStatusFilter,
    data?.companies,
    integrationFilter,
    onlyIncompleteOnboarding,
    planFilter,
    responseRangeFilter,
    riskFilter,
    search,
    sortBy,
  ]);

  if (loading) {
    return (
      <main className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "#2e7fa3", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "#7a9aaa" }}>Carregando painel...</p>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const viewerRoleLabel = ROLE_LABEL[data.viewer.role] ?? data.viewer.role;
  const canManageTenants = data.viewer.role !== "ANALYST";

  return (
    <SidebarShell
      badge="Painel All Lives"
      title="Empresas"
      subtitle="Gerencie as empresas e acompanhe os resultados das avaliações."
      userName="Equipe All Lives"
      userRole={viewerRoleLabel}
      nav={[
        { href: "/consultor", label: "Painel geral", icon: "🌐" },
      ]}
      actions={<Link href="/" className="btn-ghost text-xs px-3 py-2">← Home</Link>}
    >
      {canManageTenants && (
        <div className="card-3d-sm p-6 mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>Cadastrar nova empresa</h2>
              <p className="mt-1 text-xs" style={{ color: "#7a9aaa" }}>
                Preencha os dados da empresa e uma avaliação será criada automaticamente.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary text-xs px-4 py-2"
              onClick={() => {
                setShowCreateForm((current) => !current);
                setCreateError("");
              }}
            >
              {showCreateForm ? "Cancelar" : "Nova empresa"}
            </button>
          </div>

          {showCreateForm && (
            <div className="mt-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="text-xs font-medium" style={{ color: "#5a7a8a" }}>
                  Nome da empresa
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
                    className="mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none"
                    style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
                    placeholder="Ex.: Clínica Horizonte"
                  />
                </label>
                <label className="text-xs font-medium" style={{ color: "#5a7a8a" }}>
                  CNPJ
                  <input
                    type="text"
                    value={createForm.cnpj}
                    onChange={(event) => setCreateForm((current) => ({ ...current, cnpj: event.target.value }))}
                    className="mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none"
                    style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
                    placeholder="00.000.000/0001-00"
                  />
                </label>
              </div>

              {createError && (
                <div className="mt-4 rounded-2xl px-4 py-3 text-xs"
                  style={{ background: "rgba(220,38,38,0.08)", color: "#b91c1c", border: "1px solid rgba(220,38,38,0.12)" }}>
                  {createError}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn-ghost text-xs px-4 py-2"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary text-xs px-4 py-2"
                  onClick={createCompany}
                  disabled={creatingCompany}
                >
                  {creatingCompany ? "Cadastrando..." : "Cadastrar empresa"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Empresas", value: data.totals.companies, icon: "🏢", color: "#2e7fa3" },
          { label: "Avaliações abertas", value: data.totals.activeCampaigns, icon: "✅", color: "#5baa6d" },
          { label: "Respostas anônimas", value: data.totals.totalResponses, icon: "📝", color: "#1e5f7a" },
          { label: "Alertas abertos", value: data.totals.unresolvedAlerts, icon: "🚨", color: "#dc2626" },
          { label: "Cadastro pendente", value: data.totals.onboardingIncomplete, icon: "🧭", color: "#b45309" },
          { label: "Saúde crítica", value: data.totals.criticalHealth, icon: "🩺", color: "#dc2626" },
          { label: "Funcionários", value: data.totals.totalUsers, icon: "👥", color: "#2e7fa3" },
          { label: "Planos abertos", value: data.totals.openActionPlans, icon: "📌", color: "#f59e0b" },
          { label: "Avaliações", value: data.totals.totalCampaigns, icon: "📋", color: "#7a9aaa" },
          { label: "Escopo", value: data.viewer.role === "OWNER" ? "Global" : "Vinculado", icon: "🔐", color: "#8b5cf6" },
        ].map((item) => (
          <div key={item.label} className="card-3d-sm p-5">
            <div className="mb-2 text-2xl">{item.icon}</div>
            <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="mt-1 text-xs" style={{ color: "#7a9aaa" }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-8 grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
        <div className="card-3d-sm p-6">
          <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>Empresas</h2>
              <p className="mt-1 text-xs" style={{ color: "#7a9aaa" }}>
                Busque e filtre empresas por risco, atividade e volume de respostas.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome, slug ou CNPJ..."
                className="w-full min-w-[280px] rounded-xl border px-4 py-2 text-sm outline-none"
                style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
              />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="rounded-xl border px-4 py-2 text-sm outline-none"
                style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
              >
                <option value="NAME">Ordenar: Nome</option>
                <option value="RESPONSES">Ordenar: Mais respostas</option>
                <option value="RECENT_ACTIVITY">Ordenar: Atividade recente</option>
                <option value="RISK">Ordenar: Maior risco</option>
                <option value="ONBOARDING">Ordenar: Cadastro pendente</option>
              </select>
            </div>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <select value={campaignStatusFilter} onChange={(event) => setCampaignStatusFilter(event.target.value)} className="rounded-xl border px-4 py-2 text-sm outline-none" style={{ borderColor: "rgba(91,158,201,0.18)", background: "white", color: "#1e3a4a" }}>
              <option value="ALL">Status da avaliação</option>
              <option value="DRAFT">Rascunho</option>
              <option value="ACTIVE">Ativa</option>
              <option value="CLOSED">Encerrada</option>
              <option value="ARCHIVED">Arquivada</option>
            </select>
            <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} className="rounded-xl border px-4 py-2 text-sm outline-none" style={{ borderColor: "rgba(91,158,201,0.18)", background: "white", color: "#1e3a4a" }}>
              <option value="ALL">Risco atual</option>
              <option value="LOW">Baixo</option>
              <option value="MEDIUM">Moderado</option>
              <option value="HIGH">Alto</option>
              <option value="CRITICAL">Crítico</option>
            </select>
            <select value={adminFilter} onChange={(event) => setAdminFilter(event.target.value as BinaryFilter)} className="rounded-xl border px-4 py-2 text-sm outline-none" style={{ borderColor: "rgba(91,158,201,0.18)", background: "white", color: "#1e3a4a" }}>
              <option value="ALL">Admin inicial</option>
              <option value="YES">Com admin</option>
              <option value="NO">Sem admin</option>
            </select>
            <select value={integrationFilter} onChange={(event) => setIntegrationFilter(event.target.value as BinaryFilter)} className="rounded-xl border px-4 py-2 text-sm outline-none" style={{ borderColor: "rgba(91,158,201,0.18)", background: "white", color: "#1e3a4a" }}>
              <option value="ALL">Integração RH</option>
              <option value="YES">Com integração</option>
              <option value="NO">Sem integração</option>
            </select>
            <select value={activeCampaignFilter} onChange={(event) => setActiveCampaignFilter(event.target.value as BinaryFilter)} className="rounded-xl border px-4 py-2 text-sm outline-none" style={{ borderColor: "rgba(91,158,201,0.18)", background: "white", color: "#1e3a4a" }}>
              <option value="ALL">Avaliação aberta</option>
              <option value="YES">Com avaliação aberta</option>
              <option value="NO">Sem avaliação aberta</option>
            </select>
            <select value={responseRangeFilter} onChange={(event) => setResponseRangeFilter(event.target.value as ResponseRangeFilter)} className="rounded-xl border px-4 py-2 text-sm outline-none" style={{ borderColor: "rgba(91,158,201,0.18)", background: "white", color: "#1e3a4a" }}>
              <option value="ALL">Faixa de respostas</option>
              <option value="0">0 respostas</option>
              <option value="1_10">1 a 10</option>
              <option value="11_50">11 a 50</option>
              <option value="51_PLUS">50+</option>
            </select>
            <select value={alertsFilter} onChange={(event) => setAlertsFilter(event.target.value as BinaryFilter)} className="rounded-xl border px-4 py-2 text-sm outline-none" style={{ borderColor: "rgba(91,158,201,0.18)", background: "white", color: "#1e3a4a" }}>
              <option value="ALL">Alertas abertos</option>
              <option value="YES">Com alertas</option>
              <option value="NO">Sem alertas</option>
            </select>
            <select value={planFilter} onChange={(event) => setPlanFilter(event.target.value as BinaryFilter)} className="rounded-xl border px-4 py-2 text-sm outline-none" style={{ borderColor: "rgba(91,158,201,0.18)", background: "white", color: "#1e3a4a" }}>
              <option value="ALL">Planos em aberto</option>
              <option value="YES">Com planos</option>
              <option value="NO">Sem planos</option>
            </select>
            <select value={activityFilter} onChange={(event) => setActivityFilter(event.target.value as ActivityFilter)} className="rounded-xl border px-4 py-2 text-sm outline-none" style={{ borderColor: "rgba(91,158,201,0.18)", background: "white", color: "#1e3a4a" }}>
              <option value="ALL">Última atividade</option>
              <option value="NONE">Sem atividade</option>
              <option value="LAST_7_DAYS">Últimos 7 dias</option>
              <option value="LAST_30_DAYS">Últimos 30 dias</option>
              <option value="STALE">Mais de 30 dias</option>
            </select>
            <label className="flex items-center gap-3 rounded-xl border px-4 py-2 text-sm"
              style={{ borderColor: "rgba(91,158,201,0.18)", background: "rgba(91,158,201,0.04)", color: "#1e3a4a" }}>
              <input
                type="checkbox"
                checked={onlyIncompleteOnboarding}
                onChange={(event) => setOnlyIncompleteOnboarding(event.target.checked)}
              />
              Só cadastro incompleto
            </label>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-ghost text-xs px-3 py-2"
              onClick={() => {
                setCampaignStatusFilter("ALL");
                setRiskFilter("ALL");
                setOnlyIncompleteOnboarding(false);
                setAdminFilter("ALL");
                setIntegrationFilter("ALL");
                setActiveCampaignFilter("ALL");
                setResponseRangeFilter("ALL");
                setAlertsFilter("ALL");
                setPlanFilter("ALL");
                setActivityFilter("ALL");
                setSortBy("NAME");
                setSearch("");
              }}
            >
              Limpar filtros
            </button>
            <span className="rounded-full px-3 py-2 text-xs" style={{ background: "rgba(46,127,163,0.08)", color: "#1e5f7a" }}>
              {filteredCompanies.length} empresa(s) na visão atual
            </span>
          </div>

          <div className="space-y-4">
            {filteredCompanies.map((company) => {
              const onboardingSteps = getOnboardingSteps(company);
              return (
                <div
                  key={company.id}
                  className="rounded-3xl border p-5"
                  style={{ borderColor: "rgba(91,158,201,0.12)", background: "rgba(91,158,201,0.04)" }}
                >
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold" style={{ color: "#1e3a4a" }}>{company.name}</h3>
                          <span
                            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{
                              background: `${HEALTH_COLOR[company.healthStatus]}18`,
                              color: HEALTH_COLOR[company.healthStatus],
                            }}
                          >
                            {HEALTH_LABEL[company.healthStatus]}
                          </span>
                          {company.currentRiskLevel && (
                            <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                              style={{ background: "rgba(30,95,122,0.08)", color: "#1e5f7a" }}>
                              Risco {RISK_LABEL[company.currentRiskLevel]}
                            </span>
                          )}
                          {company.lastCampaign && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                              style={{
                                background: `${STATUS_COLOR[company.lastCampaign.status] ?? "#7a9aaa"}20`,
                                color: STATUS_COLOR[company.lastCampaign.status] ?? "#7a9aaa",
                              }}
                            >
                              {STATUS_LABEL[company.lastCampaign.status] ?? company.lastCampaign.status}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs" style={{ color: "#7a9aaa" }}>
                          {company.cnpj ?? "CNPJ não informado"} · slug `{company.slug}` · última atividade {formatDate(company.lastActivityAt)}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed" style={{ color: "#5a7a8a" }}>
                          {company.healthReason}
                        </p>
                      </div>

                      <div className="grid min-w-[260px] grid-cols-2 gap-2 text-xs">
                        <div className="rounded-2xl px-3 py-3" style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626" }}>
                          {company.unresolvedAlerts} alerta(s)
                        </div>
                        <div className="rounded-2xl px-3 py-3" style={{ background: "rgba(245,158,11,0.08)", color: "#b45309" }}>
                          {company.openActionPlans} plano(s)
                        </div>
                        <div className="rounded-2xl px-3 py-3" style={{ background: "rgba(46,127,163,0.08)", color: "#1e5f7a" }}>
                          {company.totalResponses} resposta(s)
                        </div>
                        <div className="rounded-2xl px-3 py-3" style={{ background: "rgba(91,170,109,0.08)", color: "#3d8a50" }}>
                          {company.activeCampaigns} ativa(s)
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                      <div className="rounded-2xl border p-4"
                        style={{ borderColor: "rgba(91,158,201,0.12)", background: "rgba(255,255,255,0.72)" }}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "#2e7fa3" }}>
                              Progresso
                            </p>
                            <p className="mt-1 text-xs" style={{ color: "#7a9aaa" }}>
                              {company.onboarding.completedSteps}/{company.onboarding.totalSteps} etapas concluídas
                            </p>
                          </div>
                          <span className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>
                            {Math.round((company.onboarding.completedSteps / company.onboarding.totalSteps) * 100)}%
                          </span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: "rgba(91,158,201,0.12)" }}>
                          <div
                            style={{
                              width: `${(company.onboarding.completedSteps / company.onboarding.totalSteps) * 100}%`,
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

                      <div className="rounded-2xl border p-4"
                        style={{ borderColor: "rgba(91,158,201,0.12)", background: "rgba(255,255,255,0.72)" }}>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "#2e7fa3" }}>
                          Operação
                        </p>
                        <div className="mt-3 space-y-2 text-xs" style={{ color: "#5a7a8a" }}>
                          <p>Admin inicial: <strong style={{ color: "#1e3a4a" }}>{company.hasInitialAdmin ? "Sim" : "Não"}</strong></p>
                          <p>Integração RH: <strong style={{ color: "#1e3a4a" }}>{company.integrationConfigured ? "Configurada" : "Pendente"}</strong></p>
                          <p>Última resposta: <strong style={{ color: "#1e3a4a" }}>{formatDate(company.latestResponseAt)}</strong></p>
                          <p>Última sincronização RH: <strong style={{ color: "#1e3a4a" }}>{formatDate(company.lastSyncAt)}</strong></p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/consultor/empresas/${company.id}${company.lastCampaign ? `?campaign=${company.lastCampaign.id}` : ""}`}
                        className="btn-primary text-xs px-3 py-2"
                      >
                        Ver resultados
                      </Link>
                      <Link href={`/consultor/empresas/${company.id}/gestao`} className="btn-ghost text-xs px-3 py-2">
                        ⚙ Gestão
                      </Link>
                      <Link href={`/consultor/empresas/${company.id}/importar`} className="btn-ghost text-xs px-3 py-2">
                        📤 Importar usuários
                      </Link>
                      <Link href={`/consultor/empresas/${company.id}/integracao`} className="btn-ghost text-xs px-3 py-2">
                        🔗 Integração RH
                      </Link>
                      <Link href={`/consultor/empresas/${company.id}/auditoria`} className="btn-ghost text-xs px-3 py-2">
                        📋 Auditoria
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredCompanies.length === 0 && (
              <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm" style={{ borderColor: "rgba(91,158,201,0.2)", color: "#7a9aaa" }}>
                Nenhuma empresa encontrada com os filtros atuais.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-3d-sm p-6">
            <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>Atenção necessária</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-2xl p-4" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.12)" }}>
                <p className="font-semibold" style={{ color: "#dc2626" }}>Saúde crítica</p>
                <p className="mt-1 text-xs" style={{ color: "#7a9aaa" }}>
                  {data.totals.criticalHealth} empresa(s) estão em faixa crítica por risco consolidado ou alertas abertos.
                </p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.14)" }}>
                <p className="font-semibold" style={{ color: "#b45309" }}>Cadastro incompleto</p>
                <p className="mt-1 text-xs" style={{ color: "#7a9aaa" }}>
                  {data.totals.onboardingIncomplete} empresa(s) ainda não concluíram o cadastro completo.
                </p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "rgba(91,170,109,0.08)", border: "1px solid rgba(91,170,109,0.16)" }}>
                <p className="font-semibold" style={{ color: "#3d8a50" }}>Avaliações abertas</p>
                <p className="mt-1 text-xs" style={{ color: "#7a9aaa" }}>
                  {data.totals.activeCampaigns} avaliação(ões) em andamento no momento.
                </p>
              </div>
            </div>
          </div>

          <div className="card-3d-sm p-6">
            <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>Escopo e governança</h2>
            <div className="mt-4 space-y-3 text-xs" style={{ color: "#5a7a8a" }}>
              <p><strong>OWNER</strong>: visão global, cadastro e gestão de empresas, vínculos e avaliações.</p>
              <p><strong>CONSULTANT</strong>: opera apenas as empresas vinculadas e seus fluxos.</p>
              <p><strong>ANALYST</strong>: leitura analítica, sem alterações em empresa, integração ou vínculos.</p>
            </div>
          </div>
        </div>
      </div>
    </SidebarShell>
  );
}

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
};

type CompanyCard = {
  id: string;
  name: string;
  slug: string;
  totalUsers: number;
  totalCampaigns: number;
  totalResponses: number;
  activeCampaigns: number;
  unresolvedAlerts: number;
  openActionPlans: number;
  lastCampaign: Campaign | null;
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
  };
  companies: CompanyCard[];
};

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

export default function ConsultorPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    name: "",
    cnpj: "",
    slug: "",
    createInitialCampaign: true,
    campaignTitle: "",
    createInitialAdmin: true,
    adminName: "",
    adminEmail: "",
    adminCpf: "",
    adminPin: "",
    adminSector: "Recursos Humanos",
    adminJobTitle: "Administrador do tenant",
  });

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

  const filteredCompanies = useMemo(
    () =>
      (data?.companies ?? []).filter((company) =>
        company.name.toLowerCase().includes(search.toLowerCase())
      ),
    [data?.companies, search]
  );

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
      setCreateForm({
        name: "",
        cnpj: "",
        slug: "",
        createInitialCampaign: true,
        campaignTitle: "",
        createInitialAdmin: true,
        adminName: "",
        adminEmail: "",
        adminCpf: "",
        adminPin: "",
        adminSector: "Recursos Humanos",
        adminJobTitle: "Administrador do tenant",
      });

      router.push(
        `/consultor/empresas/${payload.company.id}${payload.campaign ? `?campaign=${payload.campaign.id}` : ""}`
      );
    } finally {
      setCreatingCompany(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "#2e7fa3", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "#7a9aaa" }}>Carregando visão global...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  const viewerRoleLabel = ROLE_LABEL[data.viewer.role] ?? data.viewer.role;
  const canManageTenants = data.viewer.role !== "ANALYST";

  return (
    <SidebarShell
      badge="Backoffice All Lives"
      title="Visão Global"
      subtitle="Acompanhe todos os tenants, campanhas ativas, alertas e operação da carteira em um único painel."
      userName="Equipe All Lives"
      userRole={viewerRoleLabel}
      nav={[
        { href: "/consultor", label: "Dashboard global", icon: "🌐" },
      ]}
      actions={<Link href="/" className="btn-ghost text-xs px-3 py-2">← Home</Link>}
    >
      {canManageTenants && (
        <div className="card-3d-sm p-6 mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>Cadastrar novo tenant</h2>
              <p className="mt-1 text-xs" style={{ color: "#7a9aaa" }}>
                Crie uma nova empresa cliente, vincule ao consultor atual e, se quiser, já gere a campanha inicial.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary text-xs px-4 py-2"
              onClick={() => setShowCreateForm((current) => !current)}
            >
              {showCreateForm ? "Fechar cadastro" : "Nova empresa"}
            </button>
          </div>

          {showCreateForm && (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
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
                  placeholder="Opcional"
                />
              </label>
              <label className="text-xs font-medium" style={{ color: "#5a7a8a" }}>
                Slug
                <input
                  type="text"
                  value={createForm.slug}
                  onChange={(event) => setCreateForm((current) => ({ ...current, slug: event.target.value }))}
                  className="mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none"
                  style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
                  placeholder="Opcional. Ex.: clinica-horizonte"
                />
              </label>
              <label className="text-xs font-medium" style={{ color: "#5a7a8a" }}>
                Título da campanha inicial
                <input
                  type="text"
                  value={createForm.campaignTitle}
                  onChange={(event) => setCreateForm((current) => ({ ...current, campaignTitle: event.target.value }))}
                  className="mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none"
                  style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
                  placeholder="Opcional"
                  disabled={!createForm.createInitialCampaign}
                />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm lg:col-span-2"
                style={{ borderColor: "rgba(91,158,201,0.18)", background: "rgba(91,158,201,0.04)", color: "#1e3a4a" }}>
                <input
                  type="checkbox"
                  checked={createForm.createInitialCampaign}
                  onChange={(event) => setCreateForm((current) => ({ ...current, createInitialCampaign: event.target.checked }))}
                />
                Criar campanha inicial em rascunho
              </label>
              <label className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm lg:col-span-2"
                style={{ borderColor: "rgba(91,170,109,0.18)", background: "rgba(91,170,109,0.05)", color: "#1e3a4a" }}>
                <input
                  type="checkbox"
                  checked={createForm.createInitialAdmin}
                  onChange={(event) => setCreateForm((current) => ({ ...current, createInitialAdmin: event.target.checked }))}
                />
                Criar admin inicial da empresa
              </label>

              {createForm.createInitialAdmin && (
                <>
                  <div className="lg:col-span-2 rounded-2xl border px-4 py-4"
                    style={{ borderColor: "rgba(91,170,109,0.18)", background: "rgba(91,170,109,0.04)" }}>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "#3d8a50" }}>
                      Admin inicial do tenant
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "#5a7a8a" }}>
                      Esse usuário poderá entrar em `/login` e operar o dashboard da empresa.
                    </p>
                  </div>
                  <label className="text-xs font-medium" style={{ color: "#5a7a8a" }}>
                    Nome do admin
                    <input
                      type="text"
                      value={createForm.adminName}
                      onChange={(event) => setCreateForm((current) => ({ ...current, adminName: event.target.value }))}
                      className="mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none"
                      style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
                      placeholder="Ex.: Paula RH"
                    />
                  </label>
                  <label className="text-xs font-medium" style={{ color: "#5a7a8a" }}>
                    E-mail do admin
                    <input
                      type="email"
                      value={createForm.adminEmail}
                      onChange={(event) => setCreateForm((current) => ({ ...current, adminEmail: event.target.value }))}
                      className="mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none"
                      style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
                      placeholder="Opcional"
                    />
                  </label>
                  <label className="text-xs font-medium" style={{ color: "#5a7a8a" }}>
                    CPF do admin
                    <input
                      type="text"
                      value={createForm.adminCpf}
                      onChange={(event) => setCreateForm((current) => ({ ...current, adminCpf: event.target.value }))}
                      className="mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none"
                      style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
                      placeholder="000.000.000-00"
                    />
                  </label>
                  <label className="text-xs font-medium" style={{ color: "#5a7a8a" }}>
                    PIN inicial
                    <input
                      type="text"
                      value={createForm.adminPin}
                      onChange={(event) => setCreateForm((current) => ({ ...current, adminPin: event.target.value }))}
                      className="mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none"
                      style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
                      placeholder="6 dígitos"
                    />
                  </label>
                  <label className="text-xs font-medium" style={{ color: "#5a7a8a" }}>
                    Setor
                    <input
                      type="text"
                      value={createForm.adminSector}
                      onChange={(event) => setCreateForm((current) => ({ ...current, adminSector: event.target.value }))}
                      className="mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none"
                      style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
                    />
                  </label>
                  <label className="text-xs font-medium" style={{ color: "#5a7a8a" }}>
                    Cargo
                    <input
                      type="text"
                      value={createForm.adminJobTitle}
                      onChange={(event) => setCreateForm((current) => ({ ...current, adminJobTitle: event.target.value }))}
                      className="mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none"
                      style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
                    />
                  </label>
                </>
              )}

              {createError && (
                <div className="rounded-2xl px-4 py-3 text-xs lg:col-span-2"
                  style={{ background: "rgba(220,38,38,0.08)", color: "#b91c1c", border: "1px solid rgba(220,38,38,0.12)" }}>
                  {createError}
                </div>
              )}

              <div className="flex gap-3 lg:col-span-2">
                <button
                  type="button"
                  className="btn-primary text-xs px-4 py-2"
                  onClick={createCompany}
                  disabled={creatingCompany}
                >
                  {creatingCompany ? "Cadastrando..." : "Salvar empresa"}
                </button>
                <button
                  type="button"
                  className="btn-ghost text-xs px-4 py-2"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Empresas", value: data.totals.companies, icon: "🏢", color: "#2e7fa3" },
          { label: "Campanhas ativas", value: data.totals.activeCampaigns, icon: "✅", color: "#5baa6d" },
          { label: "Respostas anônimas", value: data.totals.totalResponses, icon: "📝", color: "#1e5f7a" },
          { label: "Alertas abertos", value: data.totals.unresolvedAlerts, icon: "🚨", color: "#dc2626" },
          { label: "Funcionários", value: data.totals.totalUsers, icon: "👥", color: "#2e7fa3" },
          { label: "Planos abertos", value: data.totals.openActionPlans, icon: "📌", color: "#f59e0b" },
          { label: "Campanhas", value: data.totals.totalCampaigns, icon: "📋", color: "#7a9aaa" },
          { label: "Escopo", value: data.viewer.role === "OWNER" ? "Global" : "Vinculado", icon: "🔐", color: "#8b5cf6" },
        ].map((item) => (
          <div key={item.label} className="card-3d-sm p-5">
            <div className="mb-2 text-2xl">{item.icon}</div>
            <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="mt-1 text-xs" style={{ color: "#7a9aaa" }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-8 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="card-3d-sm p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>Carteira de clientes</h2>
              <p className="mt-1 text-xs" style={{ color: "#7a9aaa" }}>
                Busca rápida e acesso aos painéis de cada tenant.
              </p>
            </div>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar empresa..."
              className="w-full max-w-[240px] rounded-xl border px-4 py-2 text-sm outline-none"
              style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
            />
          </div>

          <div className="space-y-3">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="rounded-2xl border p-4"
                style={{ borderColor: "rgba(91,158,201,0.12)", background: "rgba(91,158,201,0.04)" }}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>{company.name}</h3>
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
                      {company.totalUsers} usuários · {company.totalResponses} respostas · {company.activeCampaigns} campanha(s) ativa(s)
                    </p>
                    {company.lastCampaign && (
                      <p className="mt-2 text-xs" style={{ color: "#5a7a8a" }}>
                        Última campanha: <strong>{company.lastCampaign.title}</strong> · /r/{company.lastCampaign.slug}
                      </p>
                    )}
                  </div>

                  <div className="grid min-w-[220px] grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl px-3 py-2" style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626" }}>
                      {company.unresolvedAlerts} alerta(s)
                    </div>
                    <div className="rounded-xl px-3 py-2" style={{ background: "rgba(245,158,11,0.08)", color: "#b45309" }}>
                      {company.openActionPlans} plano(s)
                    </div>
                    <div className="rounded-xl px-3 py-2" style={{ background: "rgba(46,127,163,0.08)", color: "#1e5f7a" }}>
                      {company.totalCampaigns} campanha(s)
                    </div>
                    <Link
                      href={`/consultor/empresas/${company.id}${company.lastCampaign ? `?campaign=${company.lastCampaign.id}` : ""}`}
                      className="rounded-xl px-3 py-2 text-center font-semibold"
                      style={{ background: "linear-gradient(135deg,#2e7fa3,#1e5f7a)", color: "white" }}
                    >
                      Abrir tenant
                    </Link>
                  </div>
                </div>

                {canManageTenants && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/consultor/empresas/${company.id}/importar`} className="btn-ghost text-xs px-3 py-1.5">
                      📤 Importar usuários
                    </Link>
                    <Link href={`/consultor/empresas/${company.id}/integracao`} className="btn-ghost text-xs px-3 py-1.5">
                      🔗 Integração RH
                    </Link>
                    <Link href={`/consultor/empresas/${company.id}/auditoria`} className="btn-ghost text-xs px-3 py-1.5">
                      📋 Auditoria
                    </Link>
                  </div>
                )}
              </div>
            ))}

            {filteredCompanies.length === 0 && (
              <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm" style={{ borderColor: "rgba(91,158,201,0.2)", color: "#7a9aaa" }}>
                Nenhuma empresa encontrada.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-3d-sm p-6">
            <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>Prioridades operacionais</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-2xl p-4" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.12)" }}>
                <p className="font-semibold" style={{ color: "#dc2626" }}>Alertas críticos pendentes</p>
                <p className="mt-1 text-xs" style={{ color: "#7a9aaa" }}>
                  {data.totals.unresolvedAlerts} alerta(s) ainda sem resolução no conjunto da carteira.
                </p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.14)" }}>
                <p className="font-semibold" style={{ color: "#b45309" }}>Planos de ação em aberto</p>
                <p className="mt-1 text-xs" style={{ color: "#7a9aaa" }}>
                  {data.totals.openActionPlans} plano(s) precisam de acompanhamento.
                </p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "rgba(91,170,109,0.08)", border: "1px solid rgba(91,170,109,0.16)" }}>
                <p className="font-semibold" style={{ color: "#3d8a50" }}>Campanhas ativas</p>
                <p className="mt-1 text-xs" style={{ color: "#7a9aaa" }}>
                  {data.totals.activeCampaigns} campanha(s) em execução no momento.
                </p>
              </div>
            </div>
          </div>

          <div className="card-3d-sm p-6">
            <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>Escopo de acesso</h2>
            <div className="mt-4 space-y-3 text-xs" style={{ color: "#5a7a8a" }}>
              <p><strong>OWNER</strong>: visão global de todos os tenants e ações de gestão.</p>
              <p><strong>CONSULTANT</strong>: visão dos tenants vinculados e operação do dia a dia.</p>
              <p><strong>ANALYST</strong>: leitura analítica sem mutações em tenants.</p>
            </div>
          </div>
        </div>
      </div>
    </SidebarShell>
  );
}

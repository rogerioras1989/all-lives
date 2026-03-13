"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";

type TopicAverage = {
  topicId: number; topicName: string; averageScore: number;
  riskDistribution: Record<string, number>;
};
type SectorSummary = { sector: string; count: number; averageScore: number };
type DashboardData = {
  totalResponses: number; overallAverage: number;
  topicAverages: TopicAverage[]; sectorSummary: SectorSummary[];
};
type Campaign = { id: string; title: string; status: string; slug: string; _count: { responses: number } };
type Me = { id: string; name: string; role: string; companyId: string; company: { id: string; name: string; slug: string } };
type Alert = { id: string; sector: string; message: string; riskLevel: string; createdAt: string };

const RISK_COLORS: Record<string, string> = { LOW: "#5baa6d", MEDIUM: "#f59e0b", HIGH: "#f97316", CRITICAL: "#dc2626" };
const RISK_LABELS: Record<string, string> = { LOW: "Baixo", MEDIUM: "Moderado", HIGH: "Alto", CRITICAL: "Crítico" };
const RISK_BG: Record<string, string> = { LOW: "rgba(91,170,109,0.1)", MEDIUM: "rgba(245,158,11,0.1)", HIGH: "rgba(249,115,22,0.1)", CRITICAL: "rgba(220,38,38,0.1)" };
const STATUS_LABEL: Record<string, string> = { DRAFT: "Rascunho", ACTIVE: "Ativa", CLOSED: "Encerrada", ARCHIVED: "Arquivada" };
const STATUS_DOT: Record<string, string> = { DRAFT: "#9ca3af", ACTIVE: "#5baa6d", CLOSED: "#f59e0b", ARCHIVED: "#d1d5db" };

function getRisk(score: number) {
  if (score <= 25) return "LOW"; if (score <= 50) return "MEDIUM"; if (score <= 75) return "HIGH"; return "CRITICAL";
}
function RiskBadge({ score }: { score: number }) {
  const r = getRisk(score);
  return <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: RISK_BG[r], color: RISK_COLORS[r] }}>{RISK_LABELS[r]}</span>;
}

// ── Onboarding Tour ────────────────────────────────────────────────────────────
const TOUR_STEPS = [
  { title: "Bem-vindo ao DRPS Dashboard!", body: "Aqui você acompanha os resultados das campanhas de diagnóstico psicossocial da sua empresa em tempo real.", icon: "👋" },
  { title: "Selecione uma Campanha", body: "Use o seletor no topo para alternar entre campanhas. O dashboard atualiza automaticamente com os dados correspondentes.", icon: "📋" },
  { title: "Explore os Gráficos", body: "O gráfico radar mostra o perfil de risco por tópico. As barras mostram os scores. Filtre por setor para ver dados específicos.", icon: "📊" },
  { title: "Use a Análise de IA", body: "Clique em 'Análise IA' para obter insights automáticos gerados pelo Claude sobre os riscos identificados na campanha.", icon: "🤖" },
  { title: "Exporte os Dados", body: "Baixe o relatório em PDF ou exporte os dados em CSV para apresentações e análises externas.", icon: "📄" },
];

function OnboardingTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const s = TOUR_STEPS[step];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card-3d p-8 max-w-md w-full fade-up">
        <div className="flex justify-between items-start mb-4">
          <span style={{ fontSize: 40 }}>{s.icon}</span>
          <span className="text-xs" style={{ color: "#7a9aaa" }}>{step + 1} / {TOUR_STEPS.length}</span>
        </div>
        <h3 className="text-xl font-bold mb-3" style={{ color: "#1e3a4a" }}>{s.title}</h3>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: "#5a7a8a" }}>{s.body}</p>
        <div className="flex items-center gap-2 mb-6">
          {TOUR_STEPS.map((_, i) => (
            <div key={i} className="rounded-full transition-all" style={{ width: i === step ? 20 : 6, height: 6, background: i === step ? "#2e7fa3" : "rgba(91,158,201,0.25)" }} />
          ))}
        </div>
        <div className="flex gap-3">
          {step < TOUR_STEPS.length - 1 ? (
            <>
              <button onClick={onClose} className="btn-ghost text-xs px-4 py-2" style={{ color: "#7a9aaa" }}>Pular</button>
              <button onClick={() => setStep(step + 1)} className="btn-primary flex-1">Próximo →</button>
            </>
          ) : (
            <button onClick={onClose} className="btn-primary w-full">Começar a usar 🚀</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Notification Bell ──────────────────────────────────────────────────────────
function NotificationBell({ companyId }: { companyId: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/alerts").then((r) => r.json()).then((d) => setAlerts(d.alerts ?? [])).catch(() => {});
  }, [companyId]);

  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function markRead(id: string) {
    await fetch("/api/alerts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alertId: id }) });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5" style={{ position: "relative" }}>
        🔔
        {alerts.length > 0 && (
          <span style={{ position: "absolute", top: -4, right: -4, background: "#dc2626", color: "white", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {alerts.length > 9 ? "9+" : alerts.length}
          </span>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 320, background: "white", borderRadius: 16, border: "1px solid rgba(91,158,201,0.2)", boxShadow: "0 16px 40px rgba(30,95,122,0.15)", zIndex: 50, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(91,158,201,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>Alertas ({alerts.length})</span>
          </div>
          {alerts.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
              <p className="text-xs" style={{ color: "#7a9aaa" }}>Nenhum alerta pendente</p>
            </div>
          ) : (
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {alerts.map((a) => (
                <div key={a.id} style={{ padding: "10px 16px", borderBottom: "1px solid rgba(91,158,201,0.06)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16, marginTop: 1 }}>{a.riskLevel === "CRITICAL" ? "🔴" : a.riskLevel === "HIGH" ? "🟠" : "🟡"}</span>
                  <div style={{ flex: 1 }}>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: "#1e3a4a" }}>{a.sector}</p>
                    <p className="text-xs" style={{ color: "#7a9aaa" }}>{a.message}</p>
                  </div>
                  <button onClick={() => markRead(a.id)} style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer", color: "#7a9aaa", padding: "0 4px" }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── CSV Export ─────────────────────────────────────────────────────────────────
function exportCSV(data: DashboardData, title: string) {
  const rows: string[][] = [
    ["Tópico", "Score (%)", "Risco", "Baixo", "Moderado", "Alto", "Crítico"],
    ...data.topicAverages.map((t) => [
      t.topicName, String(Math.round(t.averageScore)), RISK_LABELS[getRisk(t.averageScore)],
      String(t.riskDistribution.LOW ?? 0), String(t.riskDistribution.MEDIUM ?? 0),
      String(t.riskDistribution.HIGH ?? 0), String(t.riskDistribution.CRITICAL ?? 0),
    ]),
    [],
    ["Setor", "Respostas", "Score Médio (%)", "Risco"],
    ...data.sectorSummary.map((s) => [s.sector, String(s.count), String(Math.round(s.averageScore)), RISK_LABELS[getRisk(s.averageScore)]]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `DRPS_${title.replace(/\s+/g, "_")}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaignId, setActiveCampaignId] = useState("");
  const [compareCampaignId, setCompareCampaignId] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [compareData, setCompareData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sector, setSector] = useState("all");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [campaignUrl, setCampaignUrl] = useState("");
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => { if (r.status === 401) { router.push("/login"); return null; } return r.json(); })
      .then((user: Me | null) => {
        if (!user?.companyId) return;
        setMe(user);
        if (!localStorage.getItem("drps_onboarded")) setShowOnboarding(true);
        return fetch(`/api/companies/${user.companyId}/campaigns`);
      })
      .then((r) => r?.json())
      .then((d) => {
        const list: Campaign[] = d?.campaigns ?? [];
        setCampaigns(list);
        const active = list.find((c) => c.status === "ACTIVE") ?? list[0];
        if (active) setActiveCampaignId(active.id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  function closeOnboarding() {
    localStorage.setItem("drps_onboarded", "1");
    setShowOnboarding(false);
  }

  const loadResults = useCallback(() => {
    if (!activeCampaignId) return;
    const params = new URLSearchParams();
    if (sector !== "all") params.set("sector", sector);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const qs = params.toString();
    fetch(`/api/campaigns/${activeCampaignId}/results${qs ? `?${qs}` : ""}`)
      .then((r) => r.json()).then((d) => { if (!d.error) setData(d); else setData(null); });
  }, [activeCampaignId, sector, startDate, endDate]);

  useEffect(() => { loadResults(); }, [loadResults]);

  useEffect(() => {
    if (!compareCampaignId || !compareMode) { setCompareData(null); return; }
    fetch(`/api/campaigns/${compareCampaignId}/results`)
      .then((r) => r.json()).then((d) => { if (!d.error) setCompareData(d); });
  }, [compareCampaignId, compareMode]);

  useEffect(() => { setSector("all"); setData(null); setQrCode(null); setAiResult(null); setStartDate(""); setEndDate(""); }, [activeCampaignId]);

  async function loadQr() {
    if (qrCode) { setShowQr(true); return; }
    const res = await fetch(`/api/campaigns/${activeCampaignId}/qrcode`);
    const d = await res.json(); setQrCode(d.qrCode); setCampaignUrl(d.url); setShowQr(true);
  }
  async function runAi() {
    setAiLoading(true); setAiResult(null);
    try {
      const res = await fetch(`/api/campaigns/${activeCampaignId}/ai-analysis`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: sector !== "all" ? "SECTOR" : "CAMPAIGN", sector }),
      });
      const d = await res.json(); setAiResult(d.analysis?.result || d.error);
    } finally { setAiLoading(false); }
  }
  async function handleLogout() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); }

  if (loading) {
    return (
      <main className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "#2e7fa3", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "#7a9aaa" }}>Carregando...</p>
        </div>
      </main>
    );
  }

  const sectors = ["all", ...(data?.sectorSummary?.map((s) => s.sector) ?? [])];
  const radarData = data?.topicAverages.map((t) => ({ topic: t.topicName.split(" ").slice(0, 2).join(" "), score: Math.round(t.averageScore) })) ?? [];
  const barData = data?.topicAverages.map((t) => ({ name: `T${t.topicId}`, fullName: t.topicName, score: Math.round(t.averageScore), fill: RISK_COLORS[getRisk(t.averageScore)] })) ?? [];
  const compareBarData = compareData?.topicAverages.map((t) => ({ name: `T${t.topicId}`, fullName: t.topicName, score: Math.round(t.averageScore), fill: RISK_COLORS[getRisk(t.averageScore)] })) ?? [];
  const activeCampaign = campaigns.find((c) => c.id === activeCampaignId);
  const compareCampaign = campaigns.find((c) => c.id === compareCampaignId);

  return (
    <main className="min-h-screen gradient-hero pb-16">
      {showOnboarding && <OnboardingTour onClose={closeOnboarding} />}

      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md border-b border-white/60 sticky top-0 z-20" style={{ boxShadow: "0 1px 12px rgba(30,95,122,0.08)" }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="https://all-livesocupacional.com.br/wp-content/uploads/2025/01/AllLivesPreferencial-copiar.png.webp" alt="All Lives" width={110} height={35} className="object-contain" unoptimized />
            {me?.company && <span className="text-xs font-semibold px-2.5 py-1 rounded-full hidden sm:inline" style={{ background: "rgba(91,158,201,0.1)", color: "#1e5f7a" }}>{me.company.name}</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {activeCampaignId && (
              <>
                {me?.companyId && <NotificationBell companyId={me.companyId} />}
                <button onClick={() => setShowDateFilter(!showDateFilter)} className={`btn-ghost text-xs px-3 py-2 flex items-center gap-1.5 ${showDateFilter ? "ring-2 ring-blue-300" : ""}`}>
                  📅 Período
                </button>
                <button onClick={() => setCompareMode(!compareMode)} className={`btn-ghost text-xs px-3 py-2 flex items-center gap-1.5 ${compareMode ? "ring-2 ring-blue-300" : ""}`}>
                  ⚖️ Comparar
                </button>
                <button onClick={loadQr} className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5"><span>📱</span> QR</button>
                <button onClick={runAi} disabled={aiLoading} className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5">
                  <span>🤖</span> {aiLoading ? "Analisando…" : "IA"}
                </button>
                {data && data.totalResponses > 0 && (
                  <button onClick={() => exportCSV(data, activeCampaign?.title ?? "DRPS")} className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5">
                    📥 CSV
                  </button>
                )}
                <a href={`/api/campaigns/${activeCampaignId}/pdf`} target="_blank" className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5">📄 PDF</a>
              </>
            )}
            <button onClick={handleLogout} className="btn-ghost text-xs px-3 py-2" style={{ color: "#7a9aaa" }}>Sair</button>
          </div>
        </div>
        {/* Date filter bar */}
        {showDateFilter && (
          <div className="border-t px-6 py-3 flex items-center gap-4 flex-wrap" style={{ borderColor: "rgba(91,158,201,0.12)", background: "rgba(248,251,253,0.9)" }}>
            <span className="text-xs font-medium" style={{ color: "#7a9aaa" }}>Filtrar por período:</span>
            <div className="flex items-center gap-2">
              <label className="text-xs" style={{ color: "#7a9aaa" }}>De</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded-lg px-2 py-1 text-xs outline-none" style={{ borderColor: "rgba(91,158,201,0.3)", color: "#1e3a4a" }} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs" style={{ color: "#7a9aaa" }}>Até</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded-lg px-2 py-1 text-xs outline-none" style={{ borderColor: "rgba(91,158,201,0.3)", color: "#1e3a4a" }} />
            </div>
            {(startDate || endDate) && (
              <button onClick={() => { setStartDate(""); setEndDate(""); }} className="text-xs" style={{ color: "#dc2626" }}>✕ Limpar</button>
            )}
          </div>
        )}
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-8">
        {/* Selectors */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1e3a4a" }}>Dashboard DRPS</h1>
            <p className="text-sm mt-0.5" style={{ color: "#7a9aaa" }}>{me?.name ?? "Usuário"} · {me?.role} · NR-01</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {campaigns.length > 0 && (
              <div className="relative">
                <select value={activeCampaignId} onChange={(e) => setActiveCampaignId(e.target.value)} className="border rounded-xl pl-3 pr-8 py-2 text-sm outline-none appearance-none" style={{ borderColor: "rgba(91,158,201,0.3)", background: "white", color: "#1e3a4a" }}>
                  {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title} ({STATUS_LABEL[c.status]}) · {c._count.responses} resp.</option>)}
                </select>
                <span className="absolute right-2.5 top-2.5 text-xs pointer-events-none" style={{ color: "#7a9aaa" }}>▼</span>
              </div>
            )}
            {compareMode && campaigns.length > 1 && (
              <div className="relative">
                <select value={compareCampaignId} onChange={(e) => setCompareCampaignId(e.target.value)} className="border rounded-xl pl-3 pr-8 py-2 text-sm outline-none appearance-none" style={{ borderColor: "rgba(91,170,109,0.4)", background: "rgba(91,170,109,0.04)", color: "#1e3a4a" }}>
                  <option value="">— Comparar com —</option>
                  {campaigns.filter((c) => c.id !== activeCampaignId).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <span className="absolute right-2.5 top-2.5 text-xs pointer-events-none" style={{ color: "#7a9aaa" }}>▼</span>
              </div>
            )}
            {data && data.totalResponses > 0 && (
              <select value={sector} onChange={(e) => setSector(e.target.value)} className="border rounded-xl px-3 py-2 text-sm outline-none" style={{ borderColor: "rgba(91,158,201,0.3)", background: "white", color: "#1e3a4a" }}>
                <option value="all">Todos os setores</option>
                {sectors.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>
        </div>

        {activeCampaign && (
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full" style={{ background: STATUS_DOT[activeCampaign.status] }} />
            <span className="text-xs" style={{ color: "#7a9aaa" }}>{STATUS_LABEL[activeCampaign.status]} · /r/{activeCampaign.slug}</span>
            {(startDate || endDate) && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(46,127,163,0.1)", color: "#2e7fa3" }}>📅 Período filtrado</span>}
          </div>
        )}

        {campaigns.length === 0 && (
          <div className="card-3d p-16 text-center fade-up">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#1e3a4a" }}>Nenhuma campanha encontrada</h2>
            <p className="text-sm" style={{ color: "#7a9aaa" }}>Solicite ao consultor All Lives para criar sua primeira campanha.</p>
          </div>
        )}

        {/* QR Modal */}
        {showQr && qrCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setShowQr(false)}>
            <div className="card-3d p-8 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#1e3a4a" }}>Link da Campanha</h3>
              <p className="text-xs mb-4" style={{ color: "#7a9aaa" }}>Compartilhe com os funcionários de <strong>{me?.company?.name}</strong></p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="QR Code" className="mx-auto mb-4 rounded-xl" width={200} height={200} />
              <p className="text-xs font-mono break-all mb-4 px-3 py-2 rounded-lg" style={{ background: "rgba(91,158,201,0.08)", color: "#2e7fa3" }}>{campaignUrl}</p>
              <button onClick={() => setShowQr(false)} className="btn-ghost w-full">Fechar</button>
            </div>
          </div>
        )}

        {/* AI Result */}
        {aiResult && (
          <div className="card-3d-sm p-6 mb-8 fade-up">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🤖</span>
              <h3 className="font-bold" style={{ color: "#1e3a4a" }}>Análise de IA — Claude</h3>
              <button onClick={() => setAiResult(null)} className="ml-auto text-xs" style={{ color: "#7a9aaa" }}>✕</button>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#3a5a6a" }}>{aiResult}</div>
          </div>
        )}

        {campaigns.length > 0 && (!data || data.totalResponses === 0) && (
          <div className="card-3d p-16 text-center fade-up">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#1e3a4a" }}>Nenhuma resposta ainda</h2>
            <p className="text-sm mb-6" style={{ color: "#7a9aaa" }}>Compartilhe o link ou QR Code da campanha com os funcionários.</p>
            <div className="flex justify-center gap-3">
              <button onClick={loadQr} className="btn-primary inline-flex items-center gap-2">📱 Ver QR Code</button>
              <Link href="/questionario" className="btn-ghost inline-flex items-center gap-2">Testar questionário</Link>
            </div>
          </div>
        )}

        {data && data.totalResponses > 0 && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Respostas", value: data.totalResponses, icon: "📝" },
                { label: "Score Geral", value: `${Math.round(data.overallAverage)}%`, icon: "📊", badge: data.overallAverage },
                { label: "Tópico Crítico", icon: "⚠️", value: [...data.topicAverages].sort((a, b) => b.averageScore - a.averageScore)[0]?.topicName.split(" ").slice(0, 2).join(" ") ?? "-", sub: `${Math.round([...data.topicAverages].sort((a, b) => b.averageScore - a.averageScore)[0]?.averageScore ?? 0)}%` },
                { label: "Setores", value: data.sectorSummary?.length ?? 0, icon: "🏢" },
              ].map((kpi) => (
                <div key={kpi.label} className="card-3d-sm p-5 fade-up">
                  <div className="text-xl mb-1">{kpi.icon}</div>
                  <div className="text-xs font-medium mb-1" style={{ color: "#7a9aaa" }}>{kpi.label}</div>
                  <div className="text-2xl font-bold" style={{ color: "#1e3a4a" }}>{kpi.value}</div>
                  {"badge" in kpi && kpi.badge !== undefined && <div className="mt-1"><RiskBadge score={kpi.badge} /></div>}
                  {"sub" in kpi && kpi.sub && <div className="text-sm font-semibold mt-0.5" style={{ color: "#dc2626" }}>{kpi.sub}</div>}
                </div>
              ))}
            </div>

            {/* Charts — with optional comparison */}
            <div className={`grid grid-cols-1 ${compareMode && compareData ? "lg:grid-cols-2" : "lg:grid-cols-2"} gap-6 mb-8`}>
              <div className="card-3d-sm p-6">
                <h2 className="text-sm font-semibold mb-4" style={{ color: "#1e3a4a" }}>Perfil de Risco por Tópico</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(91,158,201,0.2)" />
                    <PolarAngleAxis dataKey="topic" tick={{ fontSize: 10, fill: "#7a9aaa" }} />
                    <Radar name="Score" dataKey="score" stroke="#2e7fa3" fill="#2e7fa3" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="card-3d-sm p-6">
                <h2 className="text-sm font-semibold mb-1" style={{ color: "#1e3a4a" }}>
                  Score por Tópico (%)
                  {compareMode && compareCampaign && compareData && (
                    <span className="ml-2 text-xs font-normal" style={{ color: "#5baa6d" }}>vs {compareCampaign.title}</span>
                  )}
                </h2>
                {compareMode && compareData ? (
                  <div className="flex gap-4 mt-4">
                    {/* Primary */}
                    <div style={{ flex: 1 }}>
                      <p className="text-xs mb-2 font-medium" style={{ color: "#2e7fa3" }}>{activeCampaign?.title}</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={barData} margin={{ top: 0, right: 4, left: -24, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(91,158,201,0.15)" />
                          <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#7a9aaa" }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#7a9aaa" }} />
                          <Tooltip formatter={(v: unknown, _: unknown, p: { payload: { fullName: string } }) => [`${v}%`, p.payload.fullName]} contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                          <Bar dataKey="score" radius={[4, 4, 0, 0]}>{barData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Compare */}
                    <div style={{ flex: 1 }}>
                      <p className="text-xs mb-2 font-medium" style={{ color: "#5baa6d" }}>{compareCampaign?.title}</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={compareBarData} margin={{ top: 0, right: 4, left: -24, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(91,158,201,0.15)" />
                          <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#7a9aaa" }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#7a9aaa" }} />
                          <Tooltip formatter={(v: unknown, _: unknown, p: { payload: { fullName: string } }) => [`${v}%`, p.payload.fullName]} contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                          <Bar dataKey="score" radius={[4, 4, 0, 0]}>{compareBarData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={barData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(91,158,201,0.15)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#7a9aaa" }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#7a9aaa" }} />
                      <Tooltip formatter={(v: unknown, _: unknown, p: { payload: { fullName: string } }) => [`${v}%`, p.payload.fullName]} contentStyle={{ borderRadius: 12, border: "1px solid rgba(91,158,201,0.2)", fontSize: 12 }} />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]}>{barData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Topic table */}
            <div className="card-3d-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(91,158,201,0.1)" }}>
                <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>Detalhamento por Tópico</h2>
                <button onClick={() => exportCSV(data, activeCampaign?.title ?? "DRPS")} className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1">
                  📥 CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead style={{ background: "rgba(91,158,201,0.04)" }}>
                    <tr>
                      {["Tópico","Score","Risco","Baixo","Moderado","Alto","Crítico"].map((h, i) => (
                        <th key={h} className={`px-${i === 0 ? 6 : 4} py-3 text-xs font-medium ${i === 0 ? "text-left" : "text-center"}`}
                          style={{ color: i === 0 ? "#7a9aaa" : ["#7a9aaa","#7a9aaa","#5baa6d","#f59e0b","#f97316","#dc2626"][i - 1] }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.topicAverages.map((t) => (
                      <tr key={t.topicId} className="border-t hover:bg-blue-50/30" style={{ borderColor: "rgba(91,158,201,0.08)" }}>
                        <td className="px-6 py-3 font-medium text-sm" style={{ color: "#1e3a4a" }}>{t.topicName}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 rounded-full h-1.5" style={{ background: "rgba(91,158,201,0.15)" }}>
                              <div className="h-full rounded-full" style={{ width: `${t.averageScore}%`, background: RISK_COLORS[getRisk(t.averageScore)] }} />
                            </div>
                            <span className="text-xs font-semibold" style={{ color: "#3a5a6a" }}>{Math.round(t.averageScore)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center"><RiskBadge score={t.averageScore} /></td>
                        {(["LOW","MEDIUM","HIGH","CRITICAL"] as const).map((r) => (
                          <td key={r} className="px-4 py-3 text-center text-xs font-semibold" style={{ color: RISK_COLORS[r] }}>{t.riskDistribution[r] ?? 0}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sector table */}
            {data.sectorSummary.length > 0 && (
              <div className="card-3d-sm overflow-hidden">
                <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(91,158,201,0.1)" }}>
                  <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>Resultado por Setor</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{ background: "rgba(91,158,201,0.04)" }}>
                      <tr>
                        {["Setor","Respostas","Score Médio","Risco"].map((h, i) => (
                          <th key={h} className={`px-${i === 0 ? 6 : 4} py-3 text-xs font-medium ${i === 0 ? "text-left" : "text-center"}`} style={{ color: "#7a9aaa" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...data.sectorSummary].sort((a, b) => b.averageScore - a.averageScore).map((s) => (
                        <tr key={s.sector} className="border-t hover:bg-blue-50/30" style={{ borderColor: "rgba(91,158,201,0.08)" }}>
                          <td className="px-6 py-3 font-medium" style={{ color: "#1e3a4a" }}>{s.sector}</td>
                          <td className="px-4 py-3 text-center text-xs" style={{ color: "#3a5a6a" }}>{s.count}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 rounded-full h-1.5" style={{ background: "rgba(91,158,201,0.15)" }}>
                                <div className="h-full rounded-full" style={{ width: `${s.averageScore}%`, background: RISK_COLORS[getRisk(s.averageScore)] }} />
                              </div>
                              <span className="text-xs font-semibold" style={{ color: "#3a5a6a" }}>{Math.round(s.averageScore)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center"><RiskBadge score={s.averageScore} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";

type TopicAverage = {
  topicId: number;
  topicName: string;
  averageScore: number;
  riskDistribution: Record<string, number>;
};

type SectorSummary = {
  sector: string;
  count: number;
  averageScore: number;
};

type DashboardData = {
  totalResponses: number;
  overallAverage: number;
  topicAverages: TopicAverage[];
  sectorSummary: SectorSummary[];
};

type Campaign = {
  id: string;
  title: string;
  status: string;
  slug: string;
  _count: { responses: number };
};

type Me = {
  id: string;
  name: string;
  role: string;
  companyId: string;
  company: { id: string; name: string; slug: string };
};

const RISK_COLORS: Record<string, string> = {
  LOW: "#5baa6d", MEDIUM: "#f59e0b", HIGH: "#f97316", CRITICAL: "#dc2626",
};
const RISK_LABELS: Record<string, string> = {
  LOW: "Baixo", MEDIUM: "Moderado", HIGH: "Alto", CRITICAL: "Crítico",
};
const RISK_BG: Record<string, string> = {
  LOW: "rgba(91,170,109,0.1)", MEDIUM: "rgba(245,158,11,0.1)",
  HIGH: "rgba(249,115,22,0.1)", CRITICAL: "rgba(220,38,38,0.1)",
};

function getRisk(score: number) {
  if (score <= 25) return "LOW";
  if (score <= 50) return "MEDIUM";
  if (score <= 75) return "HIGH";
  return "CRITICAL";
}

function RiskBadge({ score }: { score: number }) {
  const r = getRisk(score);
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: RISK_BG[r], color: RISK_COLORS[r] }}>
      {RISK_LABELS[r]}
    </span>
  );
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho", ACTIVE: "Ativa", CLOSED: "Encerrada", ARCHIVED: "Arquivada",
};
const STATUS_DOT: Record<string, string> = {
  DRAFT: "#9ca3af", ACTIVE: "#5baa6d", CLOSED: "#f59e0b", ARCHIVED: "#d1d5db",
};

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaignId, setActiveCampaignId] = useState<string>("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sector, setSector] = useState("all");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [campaignUrl, setCampaignUrl] = useState("");
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Bootstrap: fetch /me + company campaigns
  useEffect(() => {
    fetch("/api/me")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((user: Me | null) => {
        if (!user || !user.companyId) return;
        setMe(user);
        return fetch(`/api/companies/${user.companyId}/campaigns`);
      })
      .then((r) => r?.json())
      .then((d) => {
        const list: Campaign[] = d?.campaigns ?? [];
        setCampaigns(list);
        // Auto-select first active, fallback to first
        const active = list.find((c) => c.status === "ACTIVE") ?? list[0];
        if (active) setActiveCampaignId(active.id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const loadResults = useCallback(() => {
    if (!activeCampaignId) return;
    // fix #17 — encodeURIComponent evita quebra de URL com setores contendo &, #, espaços, etc.
    const url = `/api/campaigns/${activeCampaignId}/results` +
      (sector !== "all" ? `?sector=${encodeURIComponent(sector)}` : "");
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setData(null);
        else setData(d);
      });
  }, [activeCampaignId, sector]);

  useEffect(() => { loadResults(); }, [loadResults]);

  // Reset state when campaign changes
  useEffect(() => {
    setSector("all");
    setData(null);
    setQrCode(null);
    setAiResult(null);
  }, [activeCampaignId]);

  async function loadQr() {
    if (qrCode) { setShowQr(true); return; }
    const res = await fetch(`/api/campaigns/${activeCampaignId}/qrcode`);
    const d = await res.json();
    setQrCode(d.qrCode);
    setCampaignUrl(d.url);
    setShowQr(true);
  }

  async function runAi() {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch(`/api/campaigns/${activeCampaignId}/ai-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: sector !== "all" ? "SECTOR" : "CAMPAIGN", sector }),
      });
      const d = await res.json();
      setAiResult(d.analysis?.result || d.error);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: "#2e7fa3", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "#7a9aaa" }}>Carregando...</p>
        </div>
      </main>
    );
  }

  const sectors = ["all", ...(data?.sectorSummary?.map((s) => s.sector) ?? [])];
  const radarData = data?.topicAverages.map((t) => ({
    topic: t.topicName.split(" ").slice(0, 2).join(" "),
    score: Math.round(t.averageScore),
  })) ?? [];
  const barData = data?.topicAverages.map((t) => ({
    name: `T${t.topicId}`,
    fullName: t.topicName,
    score: Math.round(t.averageScore),
    fill: RISK_COLORS[getRisk(t.averageScore)],
  })) ?? [];
  const activeCampaign = campaigns.find((c) => c.id === activeCampaignId);

  return (
    <main className="min-h-screen gradient-hero pb-16">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md border-b border-white/60 sticky top-0 z-20"
        style={{ boxShadow: "0 1px 12px rgba(30,95,122,0.08)" }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="https://all-livesocupacional.com.br/wp-content/uploads/2025/01/AllLivesPreferencial-copiar.png.webp"
              alt="All Lives" width={110} height={35} className="object-contain" unoptimized
            />
            {me?.company && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full hidden sm:inline"
                style={{ background: "rgba(91,158,201,0.1)", color: "#1e5f7a" }}>
                {me.company.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeCampaignId && (
              <>
                <button onClick={loadQr}
                  className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5">
                  <span>📱</span> QR Code
                </button>
                <button onClick={runAi} disabled={aiLoading}
                  className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5">
                  <span>🤖</span> {aiLoading ? "Analisando…" : "Análise IA"}
                </button>
                <a href={`/api/campaigns/${activeCampaignId}/pdf`} target="_blank"
                  className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5">
                  📄 PDF
                </a>
              </>
            )}
            <button onClick={handleLogout}
              className="btn-ghost text-xs px-3 py-2" style={{ color: "#7a9aaa" }}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-8">
        {/* User + campaign selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1e3a4a" }}>Dashboard DRPS</h1>
            <p className="text-sm mt-0.5" style={{ color: "#7a9aaa" }}>
              {me?.name ?? "Usuário"} · {me?.role} · NR-01
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Campaign selector */}
            {campaigns.length > 0 && (
              <div className="relative">
                <select
                  value={activeCampaignId}
                  onChange={(e) => setActiveCampaignId(e.target.value)}
                  className="border rounded-xl pl-3 pr-8 py-2 text-sm outline-none appearance-none"
                  style={{ borderColor: "rgba(91,158,201,0.3)", background: "white", color: "#1e3a4a" }}
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({STATUS_LABEL[c.status]}) · {c._count.responses} respostas
                    </option>
                  ))}
                </select>
                <span className="absolute right-2.5 top-2.5 text-xs pointer-events-none" style={{ color: "#7a9aaa" }}>▼</span>
              </div>
            )}

            {/* Sector filter */}
            {data && data.totalResponses > 0 && (
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="border rounded-xl px-3 py-2 text-sm outline-none"
                style={{ borderColor: "rgba(91,158,201,0.3)", background: "white", color: "#1e3a4a" }}
              >
                <option value="all">Todos os setores</option>
                {sectors.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Campaign status badge */}
        {activeCampaign && (
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full" style={{ background: STATUS_DOT[activeCampaign.status] }} />
            <span className="text-xs" style={{ color: "#7a9aaa" }}>
              {STATUS_LABEL[activeCampaign.status]} · /r/{activeCampaign.slug}
            </span>
          </div>
        )}

        {/* No campaigns */}
        {campaigns.length === 0 && (
          <div className="card-3d p-16 text-center fade-up">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#1e3a4a" }}>
              Nenhuma campanha encontrada
            </h2>
            <p className="text-sm" style={{ color: "#7a9aaa" }}>
              Sua empresa ainda não possui campanhas. Solicite ao consultor All Lives.
            </p>
          </div>
        )}

        {/* QR Modal */}
        {showQr && qrCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setShowQr(false)}>
            <div className="card-3d p-8 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#1e3a4a" }}>Link da Campanha</h3>
              <p className="text-xs mb-4" style={{ color: "#7a9aaa" }}>
                Compartilhe com os funcionários de <strong>{me?.company?.name}</strong>
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="QR Code" className="mx-auto mb-4 rounded-xl" width={200} height={200} />
              <p className="text-xs font-mono break-all mb-4 px-3 py-2 rounded-lg"
                style={{ background: "rgba(91,158,201,0.08)", color: "#2e7fa3" }}>
                {campaignUrl}
              </p>
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
              <button onClick={() => setAiResult(null)} className="ml-auto text-xs" style={{ color: "#7a9aaa" }}>
                ✕
              </button>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#3a5a6a" }}>
              {aiResult}
            </div>
          </div>
        )}

        {/* No responses */}
        {campaigns.length > 0 && (!data || data.totalResponses === 0) && (
          <div className="card-3d p-16 text-center fade-up">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#1e3a4a" }}>Nenhuma resposta ainda</h2>
            <p className="text-sm mb-6" style={{ color: "#7a9aaa" }}>
              Compartilhe o link ou QR Code da campanha com os funcionários.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={loadQr} className="btn-primary inline-flex items-center gap-2">
                📱 Ver QR Code
              </button>
              <Link href="/questionario" className="btn-ghost inline-flex items-center gap-2">
                Testar questionário
              </Link>
            </div>
          </div>
        )}

        {/* Dashboard content */}
        {data && data.totalResponses > 0 && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Respostas", value: data.totalResponses, icon: "📝" },
                { label: "Score Geral", value: `${Math.round(data.overallAverage)}%`, icon: "📊", badge: data.overallAverage },
                {
                  label: "Tópico Crítico", icon: "⚠️",
                  value: [...data.topicAverages].sort((a, b) => b.averageScore - a.averageScore)[0]
                    ?.topicName.split(" ").slice(0, 2).join(" ") ?? "-",
                  sub: `${Math.round([...data.topicAverages].sort((a, b) => b.averageScore - a.averageScore)[0]?.averageScore ?? 0)}%`,
                },
                { label: "Setores", value: data.sectorSummary?.length ?? 0, icon: "🏢" },
              ].map((kpi) => (
                <div key={kpi.label} className="card-3d-sm p-5 fade-up">
                  <div className="text-xl mb-1">{kpi.icon}</div>
                  <div className="text-xs font-medium mb-1" style={{ color: "#7a9aaa" }}>{kpi.label}</div>
                  <div className="text-2xl font-bold" style={{ color: "#1e3a4a" }}>{kpi.value}</div>
                  {"badge" in kpi && kpi.badge !== undefined && (
                    <div className="mt-1"><RiskBadge score={kpi.badge} /></div>
                  )}
                  {"sub" in kpi && kpi.sub && (
                    <div className="text-sm font-semibold mt-0.5" style={{ color: "#dc2626" }}>{kpi.sub}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="card-3d-sm p-6">
                <h2 className="text-sm font-semibold mb-4" style={{ color: "#1e3a4a" }}>
                  Perfil de Risco por Tópico
                </h2>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(91,158,201,0.2)" />
                    <PolarAngleAxis dataKey="topic" tick={{ fontSize: 10, fill: "#7a9aaa" }} />
                    <Radar name="Score" dataKey="score" stroke="#2e7fa3" fill="#2e7fa3" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="card-3d-sm p-6">
                <h2 className="text-sm font-semibold mb-4" style={{ color: "#1e3a4a" }}>
                  Score por Tópico (%)
                </h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(91,158,201,0.15)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#7a9aaa" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#7a9aaa" }} />
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(v: any, _: any, p: any) => [`${v}%`, p.payload.fullName]}
                      contentStyle={{ borderRadius: 12, border: "1px solid rgba(91,158,201,0.2)", fontSize: 12 }}
                    />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                      {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Topic table */}
            <div className="card-3d-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(91,158,201,0.1)" }}>
                <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>Detalhamento por Tópico</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead style={{ background: "rgba(91,158,201,0.04)" }}>
                    <tr>
                      {["Tópico", "Score", "Risco", "Baixo", "Moderado", "Alto", "Crítico"].map((h, i) => (
                        <th key={h} className={`px-${i === 0 ? 6 : 4} py-3 text-xs font-medium ${i === 0 ? "text-left" : "text-center"}`}
                          style={{ color: i === 0 ? "#7a9aaa" : ["#7a9aaa","#7a9aaa","#5baa6d","#f59e0b","#f97316","#dc2626"][i-1] }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.topicAverages.map((t) => (
                      <tr key={t.topicId} className="border-t hover:bg-blue-50/30"
                        style={{ borderColor: "rgba(91,158,201,0.08)" }}>
                        <td className="px-6 py-3 font-medium text-sm" style={{ color: "#1e3a4a" }}>{t.topicName}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 rounded-full h-1.5" style={{ background: "rgba(91,158,201,0.15)" }}>
                              <div className="h-full rounded-full" style={{
                                width: `${t.averageScore}%`,
                                background: RISK_COLORS[getRisk(t.averageScore)],
                              }} />
                            </div>
                            <span className="text-xs font-semibold" style={{ color: "#3a5a6a" }}>
                              {Math.round(t.averageScore)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center"><RiskBadge score={t.averageScore} /></td>
                        {(["LOW","MEDIUM","HIGH","CRITICAL"] as const).map((r) => (
                          <td key={r} className="px-4 py-3 text-center text-xs font-semibold"
                            style={{ color: RISK_COLORS[r] }}>
                            {t.riskDistribution[r] ?? 0}
                          </td>
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
                          <th key={h} className={`px-${i === 0 ? 6 : 4} py-3 text-xs font-medium ${i === 0 ? "text-left" : "text-center"}`}
                            style={{ color: "#7a9aaa" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...data.sectorSummary].sort((a, b) => b.averageScore - a.averageScore).map((s) => (
                        <tr key={s.sector} className="border-t hover:bg-blue-50/30"
                          style={{ borderColor: "rgba(91,158,201,0.08)" }}>
                          <td className="px-6 py-3 font-medium" style={{ color: "#1e3a4a" }}>{s.sector}</td>
                          <td className="px-4 py-3 text-center text-xs" style={{ color: "#3a5a6a" }}>{s.count}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 rounded-full h-1.5" style={{ background: "rgba(91,158,201,0.15)" }}>
                                <div className="h-full rounded-full" style={{
                                  width: `${s.averageScore}%`,
                                  background: RISK_COLORS[getRisk(s.averageScore)],
                                }} />
                              </div>
                              <span className="text-xs font-semibold" style={{ color: "#3a5a6a" }}>
                                {Math.round(s.averageScore)}%
                              </span>
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

"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Response = {
  id: string;
  campaign: { id: string; title: string; status: string; slug: string };
  totalScore: number | null;
  riskLevel: string | null;
  createdAt: string;
  topicCount: number;
};

type PortalData = {
  user: { id: string; name: string | null; email: string | null; sector: string | null; jobTitle: string | null; company: { id: string; name: string; slug: string } | null };
  responseMode: "ANONYMOUS";
  responseHistoryAvailable: boolean;
  responses: Response[];
  activeCampaign: { id: string; title: string; slug: string } | null;
  sectorMetrics: { campaignTitle: string; sector: string; avgScore: number; totalResponses: number } | null;
};

const RESOURCES = [
  { icon: "🧘", title: "Técnicas de mindfulness", desc: "Exercícios de respiração e presença para reduzir estresse" },
  { icon: "💬", title: "Canal de escuta ativa", desc: "Converse anonimamente com um profissional de saúde mental" },
  { icon: "📚", title: "NR-01 e seus direitos", desc: "Entenda o que a norma garante para você como trabalhador" },
  { icon: "🏃", title: "Pausas ativas", desc: "Exercícios rápidos para fazer durante o expediente" },
];

export default function PortalPage() {
  const router = useRouter();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((d) => { if (d) setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) return (
    <main className="min-h-screen gradient-hero flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "#2e7fa3", borderTopColor: "transparent" }} />
        <p className="text-sm" style={{ color: "#7a9aaa" }}>Carregando portal...</p>
      </div>
    </main>
  );

  if (!data) return null;
  const { user, responses, activeCampaign, sectorMetrics } = data;

  const lastResponse = responses[0];
  const trend = responses.length >= 2
    ? (responses[0].totalScore ?? 0) - (responses[1].totalScore ?? 0)
    : null;

  return (
    <main className="min-h-screen gradient-hero pb-16">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md border-b border-white/60 sticky top-0 z-20"
        style={{ boxShadow: "0 1px 12px rgba(30,95,122,0.08)" }}>
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="https://all-livesocupacional.com.br/wp-content/uploads/2025/01/AllLivesPreferencial-copiar.png.webp"
              alt="All Lives" width={100} height={32} className="object-contain" unoptimized />
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(91,158,201,0.12)", color: "#1e5f7a" }}>
              Meu Portal
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="btn-ghost text-xs px-3 py-2">← Home</Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 pt-8 space-y-6">
        {/* Welcome card */}
        <div className="card-3d p-6 fade-up">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold"
              style={{ background: "rgba(46,127,163,0.12)", color: "#2e7fa3" }}>
              {user.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#1e3a4a" }}>
                Olá, {user.name?.split(" ")[0] ?? "colaborador"}!
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "#7a9aaa" }}>
                {user.sector && <span>{user.sector} · </span>}
                {user.jobTitle ?? ""}
                {user.company && <span> · {user.company.name}</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Active campaign banner */}
        {activeCampaign && (
          <div className="rounded-2xl p-5 fade-up flex items-center justify-between gap-4"
            style={{ background: "rgba(46,127,163,0.08)", border: "1px solid rgba(46,127,163,0.2)" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#1e5f7a" }}>📋 Campanha ativa: {activeCampaign.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "#7a9aaa" }}>
                A pesquisa é anônima. O sistema não confirma individualmente quem já respondeu.
              </p>
            </div>
            <Link href={`/r/${activeCampaign.slug}`} className="btn-primary text-xs px-4 py-2 whitespace-nowrap">
              Responder agora →
            </Link>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 fade-up">
          {[
            { icon: "📝", value: data.responseHistoryAvailable ? responses.length : "—", label: "Histórico individual" },
            {
              icon: "🎯",
              value: data.responseHistoryAvailable && lastResponse?.totalScore != null ? `${Math.round(lastResponse.totalScore)}` : "—",
              label: "Último score"
            },
            {
              icon: trend !== null ? (trend > 0 ? "📈" : trend < 0 ? "📉" : "➡️") : "📊",
              value: data.responseHistoryAvailable && trend !== null ? `${trend > 0 ? "+" : ""}${Math.round(trend)}pts` : "—",
              label: "Evolução"
            },
            {
              icon: "🏢",
              value: sectorMetrics ? `${Math.round(sectorMetrics.avgScore)}` : "—",
              label: "Média do setor"
            },
          ].map((s) => (
            <div key={s.label} className="card-3d-sm p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-bold" style={{ color: "#1e5f7a" }}>{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: "#7a9aaa" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* History */}
          <div className="card-3d-sm p-5 fade-up">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#1e3a4a" }}>📜 Privacidade da resposta</h2>
            <div className="rounded-xl px-4 py-4"
              style={{ background: "rgba(91,158,201,0.05)", border: "1px solid rgba(91,158,201,0.1)" }}>
              <p className="text-sm font-medium" style={{ color: "#1e3a4a" }}>
                Este portal opera em modo de pesquisa anônima.
              </p>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: "#7a9aaa" }}>
                Para preservar a confidencialidade, a plataforma não mantém histórico individual das respostas nem mostra confirmação pessoal de participação.
                Os indicadores exibidos abaixo são agregados por setor e campanha.
              </p>
            </div>
          </div>

          {/* Sector metrics */}
          <div className="card-3d-sm p-5 fade-up">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#1e3a4a" }}>👥 Seu setor na última campanha</h2>
            {!sectorMetrics ? (
              <p className="text-xs text-center py-6" style={{ color: "#aac0cc" }}>Sem dados de setor disponíveis</p>
            ) : (
              <div className="space-y-4">
                <p className="text-xs" style={{ color: "#7a9aaa" }}>{sectorMetrics.campaignTitle}</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold" style={{ color: "#1e5f7a" }}>
                    {Math.round(sectorMetrics.avgScore)}
                  </span>
                  <span className="text-sm mb-1" style={{ color: "#7a9aaa" }}>/ 100</span>
                </div>
                <div className="w-full rounded-full h-2" style={{ background: "rgba(91,158,201,0.15)" }}>
                  <div className="rounded-full h-2 transition-all" style={{ width: `${sectorMetrics.avgScore}%`, background: "#2e7fa3" }} />
                </div>
                <p className="text-xs" style={{ color: "#7a9aaa" }}>
                  Baseado em <strong style={{ color: "#1e5f7a" }}>{sectorMetrics.totalResponses}</strong> respostas do setor <strong style={{ color: "#1e5f7a" }}>{sectorMetrics.sector}</strong>
                </p>
                <p className="text-xs italic" style={{ color: "#aac0cc" }}>Dados anônimos agregados — nenhum dado individual é exposto</p>
              </div>
            )}
          </div>
        </div>

        {/* Resources */}
        <div className="card-3d-sm p-5 fade-up">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#1e3a4a" }}>🌱 Recursos de bem-estar</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {RESOURCES.map((r) => (
              <div key={r.title} className="rounded-xl p-4"
                style={{ background: "rgba(91,158,201,0.05)", border: "1px solid rgba(91,158,201,0.1)" }}>
                <div className="flex items-start gap-3">
                  <span className="text-xl">{r.icon}</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#1e3a4a" }}>{r.title}</p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: "#7a9aaa" }}>{r.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

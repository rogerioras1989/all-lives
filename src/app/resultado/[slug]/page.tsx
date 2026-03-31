"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";

const LOGO = "https://all-livesocupacional.com.br/wp-content/uploads/2025/01/AllLivesPreferencial-copiar.png.webp";

const RISK_COLORS: Record<string, string> = { LOW: "#5baa6d", MEDIUM: "#f59e0b", HIGH: "#f97316", CRITICAL: "#dc2626" };
const RISK_LABELS: Record<string, string> = { LOW: "Baixo", MEDIUM: "Moderado", HIGH: "Alto", CRITICAL: "Crítico" };

function getRisk(score: number) {
  if (score <= 25) return "LOW";
  if (score <= 50) return "MEDIUM";
  if (score <= 75) return "HIGH";
  return "CRITICAL";
}

type ResultData = {
  campaign: { 
    title: string; 
    status: string; 
    company: { name: string; helpUrl?: string | null }; 
    startDate?: string; 
    endDate?: string 
  };
  totalResponses: number;
  overallAverage: number;
  topicAverages: { topicId: number; topicName: string; averageScore: number }[];
  sectorSummary: { sector: string; count: number; averageScore: number }[];
};

export default function PublicResultPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<ResultData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/resultado/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
        setLoading(false);
      })
      .catch(() => { setError("Erro ao carregar resultados."); setLoading(false); });
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "#2e7fa3", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "#7a9aaa" }}>Carregando resultados...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen gradient-hero flex items-center justify-center px-6">
        <div className="card-3d p-12 text-center max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#1e3a4a" }}>Resultados não disponíveis</h2>
          <p className="text-sm mb-6" style={{ color: "#7a9aaa" }}>{error || "Esta avaliação não está disponível para visualização pública."}</p>
          <Link href="/" className="btn-primary inline-block">← Voltar ao início</Link>
        </div>
      </main>
    );
  }

  const barData = data.topicAverages.map((t) => ({
    name: `T${t.topicId}`,
    fullName: t.topicName,
    score: t.averageScore,
    fill: RISK_COLORS[getRisk(t.averageScore)],
  }));

  const overallRisk = getRisk(data.overallAverage);
  const isCritical = overallRisk === "HIGH" || overallRisk === "CRITICAL";

  return (
    <main className="min-h-screen gradient-hero pb-16">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md border-b border-white/60 sticky top-0 z-20"
        style={{ boxShadow: "0 1px 12px rgba(30,95,122,0.08)" }}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Image src={LOGO} alt="All Lives" width={110} height={35} className="object-contain" unoptimized />
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(91,158,201,0.1)", color: "#1e5f7a" }}>
            Resultados Públicos
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-8">
        {/* Help Banner if Critical */}
        {isCritical && (
          <div className="mb-8 p-6 rounded-2xl border-2 border-red-500/20 bg-red-50/50 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-6 fade-up">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🆘</div>
              <div>
                <h3 className="text-lg font-bold text-red-700">Apoio emergencial disponível</h3>
                <p className="text-sm text-red-600/80">Identificamos um nível de risco elevado. Você não está sozinho(a).</p>
              </div>
            </div>
            <a 
              href={data.campaign.company.helpUrl || "https://cvv.org.br/"} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-red-200"
            >
              Precisa de ajuda agora?
            </a>
          </div>
        )}
        {/* Campaign info */}
        <div className="mb-8 fade-up">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#7a9aaa" }}>
            {data.campaign.company.name}
          </p>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "#1e3a4a" }}>{data.campaign.title}</h1>
          <p className="text-sm" style={{ color: "#7a9aaa" }}>
            Resultados agregados e anônimos · {data.totalResponses} participantes
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: "📝", label: "Participantes", value: data.totalResponses },
            { icon: "📊", label: "Score Geral", value: `${data.overallAverage}%` },
            { icon: "⚠️", label: "Nível de Risco", value: RISK_LABELS[overallRisk], color: RISK_COLORS[overallRisk] },
            { icon: "🏢", label: "Setores", value: data.sectorSummary.length },
          ].map((kpi) => (
            <div key={kpi.label} className="card-3d-sm p-5 fade-up">
              <div className="text-xl mb-1">{kpi.icon}</div>
              <div className="text-xs font-medium mb-1" style={{ color: "#7a9aaa" }}>{kpi.label}</div>
              <div className="text-2xl font-bold" style={{ color: "color" in kpi ? kpi.color : "#1e3a4a" }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        {barData.length > 0 && (
          <div className="card-3d-sm p-6 mb-8 fade-up">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#1e3a4a" }}>Score por Tópico (%)</h2>
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
        )}

        {/* Topic table */}
        <div className="card-3d-sm overflow-hidden mb-8 fade-up">
          <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(91,158,201,0.1)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>Detalhamento por Tópico</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "rgba(91,158,201,0.04)" }}>
                <tr>
                  {["Tópico", "Score", "Risco"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-xs font-medium ${i === 0 ? "text-left pl-6" : "text-center"}`}
                      style={{ color: "#7a9aaa" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.topicAverages.sort((a, b) => b.averageScore - a.averageScore).map((t) => {
                  const risk = getRisk(t.averageScore);
                  return (
                    <tr key={t.topicId} className="border-t" style={{ borderColor: "rgba(91,158,201,0.08)" }}>
                      <td className="px-6 py-3 font-medium text-sm" style={{ color: "#1e3a4a" }}>{t.topicName}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 rounded-full h-1.5" style={{ background: "rgba(91,158,201,0.15)" }}>
                            <div className="h-full rounded-full" style={{ width: `${t.averageScore}%`, background: RISK_COLORS[risk] }} />
                          </div>
                          <span className="text-xs font-semibold" style={{ color: "#3a5a6a" }}>{t.averageScore}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: `${RISK_COLORS[risk]}18`, color: RISK_COLORS[risk] }}>
                          {RISK_LABELS[risk]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-xs" style={{ color: "#aac0cc" }}>
          Resultados agregados e anônimos — conforme LGPD · All Lives Gestão Ocupacional
        </p>
      </div>
    </main>
  );
}

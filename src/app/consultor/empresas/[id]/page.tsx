"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";

type Snapshot = {
  id: string;
  snapshotDate: string;
  totalResponses: number;
  overallScore: number;
  riskLevel: string;
  topicScoresJson: { topicId: number; topicName: string; avgScore: number }[];
};

type SlaAlert = {
  id: string;
  sector: string;
  riskLevel: string;
  message: string;
  slaHours: number;
  hoursLeft: number;
  isOverdue: boolean;
  isUrgent: boolean;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

type ActionPlan = {
  id: string;
  title: string;
  description: string | null;
  sector: string | null;
  assignedTo: string | null;
  dueDate: string | null;
  status: string;
  createdAt: string;
};

const RISK_COLORS: Record<string, string> = {
  LOW: "#5baa6d",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#dc2626",
};
const RISK_LABELS: Record<string, string> = {
  LOW: "Baixo", MEDIUM: "Moderado", HIGH: "Alto", CRITICAL: "Crítico",
};
const TOPIC_COLORS = [
  "#2e7fa3","#5baa6d","#f59e0b","#f97316","#dc2626",
  "#8b5cf6","#06b6d4","#ec4899","#84cc16",
];
const PLAN_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente", IN_PROGRESS: "Em andamento", DONE: "Concluído", CANCELLED: "Cancelado",
};
const PLAN_STATUS_COLOR: Record<string, string> = {
  PENDING: "#f59e0b", IN_PROGRESS: "#2e7fa3", DONE: "#5baa6d", CANCELLED: "#9ca3af",
};

export default function EmpresaDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const campaignId = searchParams.get("campaign") ?? "campaign-demo";

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [takingSnapshot, setTakingSnapshot] = useState(false);
  const [comments, setComments] = useState<{ id: string; topicId: number; text: string; createdAt: string }[]>([]);
  const [slaAlerts, setSlaAlerts] = useState<SlaAlert[]>([]);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState({ title: "", description: "", sector: "", assignedTo: "", dueDate: "" });
  const [savingPlan, setSavingPlan] = useState(false);
  const [viewerRole, setViewerRole] = useState("CONSULTANT");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.status === 200 ? r.json() : null)
      .then((d) => { if (d?.type === "consultant" && d.role) setViewerRole(d.role); });

    fetch(`/api/campaigns/${campaignId}/snapshot`)
      .then((r) => r.json())
      .then((d) => { setSnapshots(d.snapshots ?? []); setSnapshotLoading(false); })
      .catch(() => setSnapshotLoading(false));

    fetch(`/api/campaigns/${campaignId}/comments`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []));

    fetch(`/api/alerts/sla?companyId=${id}`, { headers: { "x-company-id": id } })
      .then((r) => r.status === 200 ? r.json() : [])
      .then((d) => setSlaAlerts(Array.isArray(d) ? d : []));

    fetch(`/api/campaigns/${campaignId}/action-plans`, { headers: { "x-company-id": id } })
      .then((r) => r.status === 200 ? r.json() : [])
      .then((d) => setActionPlans(Array.isArray(d) ? d : []));
  }, [campaignId, id]);

  async function createPlan() {
    if (!planForm.title) return;
    setSavingPlan(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/action-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-company-id": id },
        body: JSON.stringify(planForm),
      });
      if (res.ok) {
        const plan = await res.json();
        setActionPlans((prev) => [plan, ...prev]);
        setShowPlanForm(false);
        setPlanForm({ title: "", description: "", sector: "", assignedTo: "", dueDate: "" });
      }
    } finally {
      setSavingPlan(false);
    }
  }

  async function updatePlanStatus(planId: string, status: string) {
    const res = await fetch(`/api/action-plans/${planId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-company-id": id },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setActionPlans((prev) => prev.map((p) => p.id === planId ? updated : p));
    }
  }

  async function acknowledgeAlert(alertId: string) {
    const res = await fetch("/api/alerts/sla", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-company-id": id },
      body: JSON.stringify({ id: alertId, action: "acknowledge" }),
    });
    if (res.ok) {
      setSlaAlerts((prev) => prev.map((a) => a.id === alertId ? { ...a, acknowledgedAt: new Date().toISOString() } : a));
    }
  }

  async function resolveAlert(alertId: string) {
    const res = await fetch("/api/alerts/sla", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-company-id": id },
      body: JSON.stringify({ id: alertId, action: "resolve" }),
    });
    if (res.ok) {
      setSlaAlerts((prev) => prev.filter((a) => a.id !== alertId));
      router.refresh();
    }
  }

  async function takeSnapshot() {
    setTakingSnapshot(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/snapshot`, { method: "POST" });
      const d = await res.json();
      if (d.snapshot) setSnapshots((prev) => [...prev, d.snapshot]);
    } finally {
      setTakingSnapshot(false);
    }
  }

  // Build line chart data from snapshots
  const lineData = snapshots.map((s) => {
    const row: Record<string, string | number> = {
      date: new Date(s.snapshotDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      geral: Math.round(s.overallScore),
    };
    for (const t of s.topicScoresJson) {
      row[`T${t.topicId}`] = Math.round(t.avgScore);
    }
    return row;
  });

  const topicKeys = snapshots[0]?.topicScoresJson.map((t) => ({
    key: `T${t.topicId}`,
    name: t.topicName,
  })) ?? [];
  const readOnly = viewerRole === "ANALYST";

  return (
    <main className="min-h-screen gradient-hero pb-16">
      <header className="bg-white/70 backdrop-blur-md border-b border-white/60 sticky top-0 z-20"
        style={{ boxShadow: "0 1px 12px rgba(30,95,122,0.08)" }}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/consultor" className="text-sm font-medium" style={{ color: "#2e7fa3" }}>
              ← Empresas
            </Link>
            <span style={{ color: "#aac0cc" }}>/</span>
            <span className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>Painel da Empresa</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href={`/consultor/empresas/${id}/auditoria`} className="btn-ghost text-xs px-3 py-2">📋 Auditoria</Link>
            <Link href={`/consultor/empresas/${id}/integracao`} className="btn-ghost text-xs px-3 py-2">🔗 Integração RH</Link>
            <a href={`/api/campaigns/${campaignId}/pdf`} target="_blank" className="btn-ghost text-xs px-3 py-2">📄 PDF</a>
            <button onClick={takeSnapshot} disabled={takingSnapshot || readOnly} className="btn-primary text-xs px-3 py-2" style={{ opacity: readOnly ? 0.5 : 1 }}>
              📸 {takingSnapshot ? "Salvando…" : "Snapshot"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-8">
        {/* Evolution chart */}
        <div className="card-3d-sm p-6 mb-8 fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>
              Evolução Temporal — Scores por Tópico
            </h2>
            <span className="text-xs" style={{ color: "#7a9aaa" }}>
              {snapshots.length} snapshots registrados
            </span>
          </div>

          {snapshotLoading ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-sm" style={{ color: "#7a9aaa" }}>Carregando histórico…</p>
            </div>
          ) : snapshots.length < 2 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <div className="text-4xl">📸</div>
              <p className="text-sm text-center" style={{ color: "#7a9aaa" }}>
                Salve ao menos 2 snapshots para ver a evolução temporal.
              </p>
              <p className="text-xs text-center" style={{ color: "#aac0cc" }}>
                Clique em <strong>Salvar Snapshot</strong> para registrar o estado atual.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(91,158,201,0.12)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#7a9aaa" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#7a9aaa" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid rgba(91,158,201,0.2)", fontSize: 11 }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any, name: any) => [`${v}%`, name]}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={75} stroke="#dc2626" strokeDasharray="4 4" strokeOpacity={0.4} />
                <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.4} />
                <Line
                  type="monotone" dataKey="geral" name="Geral"
                  stroke="#1e5f7a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }}
                />
                {topicKeys.map((t, i) => (
                  <Line
                    key={t.key}
                    type="monotone"
                    dataKey={t.key}
                    name={t.name}
                    stroke={TOPIC_COLORS[i % TOPIC_COLORS.length]}
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="4 2"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Snapshot history table */}
        {snapshots.length > 0 && (
          <div className="card-3d-sm overflow-hidden mb-8 fade-up">
            <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(91,158,201,0.1)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>Histórico de Snapshots</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: "rgba(91,158,201,0.04)" }}>
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: "#7a9aaa" }}>Data</th>
                    <th className="text-center px-4 py-3 text-xs font-medium" style={{ color: "#7a9aaa" }}>Respostas</th>
                    <th className="text-center px-4 py-3 text-xs font-medium" style={{ color: "#7a9aaa" }}>Score Geral</th>
                    <th className="text-center px-4 py-3 text-xs font-medium" style={{ color: "#7a9aaa" }}>Risco</th>
                  </tr>
                </thead>
                <tbody>
                  {[...snapshots].reverse().map((s, i) => (
                    <tr key={s.id} className="border-t transition-colors hover:bg-blue-50/30"
                      style={{ borderColor: "rgba(91,158,201,0.08)" }}>
                      <td className="px-6 py-3 text-xs" style={{ color: "#3a5a6a" }}>
                        {new Date(s.snapshotDate).toLocaleDateString("pt-BR", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                        {i === 0 && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(91,170,109,0.15)", color: "#3d8a50" }}>
                            mais recente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-xs" style={{ color: "#3a5a6a" }}>{s.totalResponses}</td>
                      <td className="px-4 py-3 text-center text-xs font-semibold" style={{ color: "#1e3a4a" }}>
                        {Math.round(s.overallScore)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: `${RISK_COLORS[s.riskLevel]}18`,
                            color: RISK_COLORS[s.riskLevel],
                          }}>
                          {RISK_LABELS[s.riskLevel]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SLA Alerts */}
        {slaAlerts.length > 0 && (
          <div className="card-3d-sm overflow-hidden mb-8 fade-up">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(91,158,201,0.1)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>🚨 Alertas com SLA</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>
                {slaAlerts.filter((a) => a.isOverdue).length} vencidos
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(91,158,201,0.08)" }}>
              {slaAlerts.map((alert) => (
                <div key={alert.id} className="px-6 py-4"
                  style={{ background: alert.isOverdue ? "rgba(220,38,38,0.03)" : alert.isUrgent ? "rgba(249,115,22,0.03)" : "transparent" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${RISK_COLORS[alert.riskLevel]}20`, color: RISK_COLORS[alert.riskLevel] }}>
                          {RISK_LABELS[alert.riskLevel]}
                        </span>
                        <span className="text-xs font-medium" style={{ color: "#1e3a4a" }}>{alert.sector}</span>
                        {alert.acknowledgedAt && (
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(91,158,201,0.1)", color: "#2e7fa3" }}>Ciente</span>
                        )}
                      </div>
                      <p className="text-xs mb-2" style={{ color: "#5a7a8a" }}>{alert.message}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold" style={{ color: alert.isOverdue ? "#dc2626" : alert.isUrgent ? "#f97316" : "#7a9aaa" }}>
                          {alert.isOverdue ? `⏰ Vencido há ${Math.abs(alert.hoursLeft)}h` : `⏱ ${alert.hoursLeft}h restantes (SLA: ${alert.slaHours}h)`}
                        </span>
                        <div className="flex-1 rounded-full h-1.5" style={{ background: "rgba(91,158,201,0.15)", maxWidth: 100 }}>
                          <div className="rounded-full h-1.5" style={{
                            width: alert.isOverdue ? "100%" : `${Math.max(0, 100 - (alert.hoursLeft / alert.slaHours) * 100)}%`,
                            background: alert.isOverdue ? "#dc2626" : alert.isUrgent ? "#f97316" : "#5baa6d"
                          }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {!readOnly && !alert.acknowledgedAt && (
                        <button onClick={() => acknowledgeAlert(alert.id)} className="btn-ghost text-xs px-2 py-1">Ciente</button>
                      )}
                      {!readOnly && <button onClick={() => resolveAlert(alert.id)} className="btn-primary text-xs px-2 py-1">Resolver</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Plans */}
        <div className="card-3d-sm overflow-hidden mb-8 fade-up">
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(91,158,201,0.1)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>📌 Planos de Ação</h2>
            {!readOnly && <button onClick={() => setShowPlanForm(true)} className="btn-primary text-xs px-3 py-1.5">+ Novo plano</button>}
          </div>

          {showPlanForm && (
            <div className="px-6 py-4 border-b" style={{ background: "rgba(91,158,201,0.03)", borderColor: "rgba(91,158,201,0.1)" }}>
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <input placeholder="Título *" value={planForm.title} onChange={(e) => setPlanForm((p) => ({ ...p, title: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: "rgba(91,158,201,0.25)" }} />
                <input placeholder="Setor (ex: TI, RH)" value={planForm.sector} onChange={(e) => setPlanForm((p) => ({ ...p, sector: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: "rgba(91,158,201,0.25)" }} />
                <input placeholder="Responsável" value={planForm.assignedTo} onChange={(e) => setPlanForm((p) => ({ ...p, assignedTo: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: "rgba(91,158,201,0.25)" }} />
                <input type="date" value={planForm.dueDate} onChange={(e) => setPlanForm((p) => ({ ...p, dueDate: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: "rgba(91,158,201,0.25)" }} />
              </div>
              <textarea placeholder="Descrição / ações detalhadas" rows={2} value={planForm.description}
                onChange={(e) => setPlanForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none mb-3" style={{ borderColor: "rgba(91,158,201,0.25)", resize: "none" }} />
              <div className="flex gap-2">
                <button onClick={() => setShowPlanForm(false)} className="btn-ghost text-xs px-4 py-2">Cancelar</button>
                <button onClick={createPlan} disabled={savingPlan || !planForm.title} className="btn-primary text-xs px-4 py-2">
                  {savingPlan ? "Salvando…" : "Salvar plano"}
                </button>
              </div>
            </div>
          )}

          {actionPlans.length === 0 && !showPlanForm ? (
            <div className="px-6 py-8 text-center">
              <p className="text-xs" style={{ color: "#aac0cc" }}>Nenhum plano de ação criado para esta campanha</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(91,158,201,0.08)" }}>
              {actionPlans.map((plan) => (
                <div key={plan.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${PLAN_STATUS_COLOR[plan.status]}20`, color: PLAN_STATUS_COLOR[plan.status] }}>
                          {PLAN_STATUS_LABEL[plan.status]}
                        </span>
                        {plan.sector && <span className="text-xs" style={{ color: "#7a9aaa" }}>{plan.sector}</span>}
                        {plan.assignedTo && <span className="text-xs" style={{ color: "#7a9aaa" }}>→ {plan.assignedTo}</span>}
                        {plan.dueDate && (
                          <span className="text-xs" style={{ color: new Date(plan.dueDate) < new Date() && plan.status !== "DONE" ? "#dc2626" : "#7a9aaa" }}>
                            📅 {new Date(plan.dueDate).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium" style={{ color: "#1e3a4a" }}>{plan.title}</p>
                      {plan.description && <p className="text-xs mt-1" style={{ color: "#7a9aaa" }}>{plan.description}</p>}
                    </div>
                    {!readOnly && plan.status !== "DONE" && plan.status !== "CANCELLED" && (
                      <div className="flex gap-1 shrink-0">
                        {plan.status === "PENDING" && (
                          <button onClick={() => updatePlanStatus(plan.id, "IN_PROGRESS")} className="btn-ghost text-xs px-2 py-1">Iniciar</button>
                        )}
                        {plan.status === "IN_PROGRESS" && (
                          <button onClick={() => updatePlanStatus(plan.id, "DONE")} className="btn-primary text-xs px-2 py-1">✓ Concluir</button>
                        )}
                        <button onClick={() => updatePlanStatus(plan.id, "CANCELLED")} className="text-xs px-2 py-1 rounded-lg"
                          style={{ color: "#9ca3af" }}>✕</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="card-3d-sm p-6 fade-up">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#1e3a4a" }}>
            💬 Comentários por Tópico ({comments.length})
          </h2>
          {comments.length === 0 ? (
            <p className="text-sm" style={{ color: "#aac0cc" }}>
              Nenhum comentário registrado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="rounded-xl px-4 py-3"
                  style={{ background: "rgba(91,158,201,0.05)", border: "1px solid rgba(91,158,201,0.12)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold" style={{ color: "#2e7fa3" }}>
                      Tópico {c.topicId}
                    </span>
                    <span className="text-xs" style={{ color: "#aac0cc" }}>
                      {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(107,114,128,0.1)", color: "#6b7280" }}>
                      anônimo
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "#3a5a6a" }}>{c.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

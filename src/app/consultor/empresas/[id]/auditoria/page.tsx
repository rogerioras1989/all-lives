"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ConsultorTenantShell } from "@/components/ConsultorTenantShell";

type Log = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  performedBy: string;
  performedByType: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

const ACTION_ICON: Record<string, string> = {
  ACTION_PLAN_CREATED: "📌",
  ACTION_PLAN_UPDATED: "✏️",
  ALERT_ACKNOWLEDGE: "👁",
  ALERT_RESOLVE: "✅",
  ALERT_ASSIGN: "👤",
  CAMPAIGN_CREATED: "🚀",
  CAMPAIGN_UPDATED: "🔄",
};

const ACTION_LABEL: Record<string, string> = {
  ACTION_PLAN_CREATED: "Plano de ação criado",
  ACTION_PLAN_UPDATED: "Plano de ação atualizado",
  ALERT_ACKNOWLEDGE: "Alerta reconhecido",
  ALERT_RESOLVE: "Alerta resolvido",
  ALERT_ASSIGN: "Alerta atribuído",
  CAMPAIGN_CREATED: "Campanha criada",
  CAMPAIGN_UPDATED: "Campanha atualizada",
};

export default function AuditoriaPage() {
  const { id } = useParams<{ id: string }>();
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 30;

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      try {
        const response = await fetch(`/api/audit?limit=${limit}&offset=${offset}`, {
          headers: { "x-company-id": id },
        });
        const data = await response.json();
        setLogs(data.logs ?? []);
        setTotal(data.total ?? 0);
      } finally {
        setLoading(false);
      }
    }

    void loadLogs();
  }, [id, offset]);

  function exportCSV() {
    const rows = [
      ["Data", "Ação", "Entidade", "Realizado por", "Tipo"],
      ...logs.map((l) => [
        new Date(l.createdAt).toLocaleString("pt-BR"),
        ACTION_LABEL[l.action] ?? l.action,
        `${l.entityType}${l.entityId ? ` (${l.entityId.slice(0, 8)})` : ""}`,
        l.performedBy,
        l.performedByType,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ConsultorTenantShell
      tenantId={id}
      actions={<button onClick={exportCSV} className="btn-ghost text-xs px-3 py-2">⬇ Exportar CSV</button>}
    >
      <div className="mx-auto max-w-5xl">
        <div className="card-3d-sm p-4 mb-6 fade-up flex items-start gap-3"
          style={{ background: "rgba(46,127,163,0.05)", border: "1px solid rgba(46,127,163,0.15)" }}>
          <span className="text-xl">🛡</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1e5f7a" }}>Conformidade NR-01</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "#5a7a8a" }}>
              Esta trilha registra todas as ações realizadas na plataforma: criação de campanhas, planos de ação, reconhecimento e resolução de alertas.
              Serve como evidência auditável para fiscalizações trabalhistas relacionadas à Norma Regulamentadora 01.
            </p>
          </div>
        </div>

        <div className="card-3d-sm overflow-hidden fade-up">
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(91,158,201,0.1)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>
              {total} registros no total
            </h2>
            <span className="text-xs" style={{ color: "#7a9aaa" }}>
              Exibindo {offset + 1}–{Math.min(offset + limit, total)}
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "#2e7fa3", borderTopColor: "transparent" }} />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm" style={{ color: "#aac0cc" }}>Nenhum registro de auditoria ainda</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(91,158,201,0.06)" }}>
              {logs.map((log) => (
                <div key={log.id} className="px-6 py-4 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
                    style={{ background: "rgba(46,127,163,0.08)" }}>
                    {ACTION_ICON[log.action] ?? "📄"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-medium" style={{ color: "#1e3a4a" }}>
                        {ACTION_LABEL[log.action] ?? log.action}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(91,158,201,0.1)", color: "#2e7fa3" }}>
                        {log.entityType}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "#7a9aaa" }}>
                      <span>Por: <strong style={{ color: "#5a7a8a" }}>{log.performedBy.slice(0, 12)}…</strong> ({log.performedByType})</span>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <span>{Object.entries(log.metadata).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(" · ")}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: "#aac0cc" }}>
                    {new Date(log.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {total > limit && (
            <div className="px-6 py-4 border-t flex justify-between" style={{ borderColor: "rgba(91,158,201,0.1)" }}>
              <button onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0}
                className="btn-ghost text-xs px-3 py-2" style={{ opacity: offset === 0 ? 0.4 : 1 }}>
                ← Anterior
              </button>
              <button onClick={() => setOffset(offset + limit)} disabled={offset + limit >= total}
                className="btn-ghost text-xs px-3 py-2" style={{ opacity: offset + limit >= total ? 0.4 : 1 }}>
                Próximo →
              </button>
            </div>
          )}
        </div>
      </div>
    </ConsultorTenantShell>
  );
}

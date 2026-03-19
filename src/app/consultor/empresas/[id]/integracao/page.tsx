"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ConsultorTenantShell, useConsultorTenantData } from "@/components/ConsultorTenantShell";

type Integration = {
  id: string;
  apiKey?: string;
  hasApiKey: boolean;
  lastSyncAt: string | null;
  syncLog: { created: number; updated: number; errors: string[]; total: number; syncedAt: string } | null;
};

export default function IntegracaoPage() {
  const { id } = useParams<{ id: string }>();
  const tenantData = useConsultorTenantData(id);
  const { readOnly } = tenantData;
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revealedApiKey, setRevealedApiKey] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/companies/${id}/integrations`, { headers: { "x-company-id": id } })
      .then((r) => r.status === 200 ? r.json() : null)
      .then((d) => { setIntegration(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function generateKey() {
    if (readOnly) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/companies/${id}/integrations`, {
        method: "POST",
        headers: { "x-company-id": id },
      });
      if (res.ok) {
        const data = await res.json();
        setIntegration(data);
        setRevealedApiKey(data.apiKey ?? null);
      }
    } finally {
      setGenerating(false);
    }
  }

  function copyKey() {
    if (!revealedApiKey) return;
    navigator.clipboard.writeText(revealedApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/hr/${id}`
    : `/api/webhooks/hr/${id}`;

  return (
    <ConsultorTenantShell
      tenantId={id}
      company={tenantData.company}
      viewerRoleLabel={tenantData.viewerRoleLabel}
      readOnly={tenantData.readOnly}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Intro */}
        <div className="card-3d p-6 fade-up">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl">🔗</span>
            <div>
              <h1 className="text-lg font-bold" style={{ color: "#1e3a4a" }}>Integração com Sistema de RH</h1>
              <p className="text-sm mt-1" style={{ color: "#7a9aaa" }}>
                Sincronize automaticamente a lista de funcionários via webhook. Suporta TOTVS, SAP, Gupy e qualquer sistema com exportação JSON.
              </p>
            </div>
          </div>
        </div>

        {readOnly && (
          <div className="card-3d-sm p-4 fade-up flex items-start gap-3"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)" }}>
            <span className="text-xl">🔒</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#9a6700" }}>Gerenciamento bloqueado para analistas</p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: "#7a6a4a" }}>
                O endpoint, a chave atual e o histórico de sincronização continuam visíveis, mas a geração ou rotação da credencial fica restrita a consultores com permissão de gestão.
              </p>
            </div>
          </div>
        )}

        {/* API Key */}
        <div className="card-3d-sm p-6 fade-up">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#1e3a4a" }}>🔑 API Key</h2>

          {loading ? (
            <div className="h-12 flex items-center">
              <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "#2e7fa3", borderTopColor: "transparent" }} />
            </div>
          ) : integration ? (
            <div className="space-y-3">
              {revealedApiKey ? (
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs px-3 py-2.5 rounded-lg font-mono"
                    style={{ background: "rgba(91,158,201,0.08)", color: "#1e3a4a", wordBreak: "break-all" }}>
                    {revealedApiKey}
                  </code>
                  <button onClick={copyKey} className="btn-ghost text-xs px-3 py-2 shrink-0">
                    {copied ? "✓ Copiado" : "Copiar"}
                  </button>
                </div>
              ) : (
                <div className="rounded-xl px-4 py-3 text-xs"
                  style={{ background: "rgba(91,158,201,0.05)", color: "#5a7a8a", border: "1px solid rgba(91,158,201,0.12)" }}>
                  A chave atual está armazenada com hash e não pode ser exibida novamente. Gere uma nova chave se precisar reenviar ao sistema de RH.
                </div>
              )}
              <div className="flex items-center justify-between">
                {integration.lastSyncAt ? (
                  <p className="text-xs" style={{ color: "#7a9aaa" }}>
                    Última sync: {new Date(integration.lastSyncAt).toLocaleString("pt-BR")}
                  </p>
                ) : (
                  <p className="text-xs" style={{ color: "#aac0cc" }}>Nenhuma sincronização realizada</p>
                )}
                <button onClick={generateKey} disabled={generating || readOnly} className="text-xs" style={{ color: readOnly ? "#9ca3af" : "#f97316" }}>
                  {generating ? "Gerando…" : "🔄 Regenerar chave"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm mb-4" style={{ color: "#7a9aaa" }}>Nenhuma integração configurada.</p>
              <button onClick={generateKey} disabled={generating || readOnly} className="btn-primary text-xs px-4 py-2" style={{ opacity: readOnly ? 0.5 : 1 }}>
                {generating ? "Gerando…" : "Gerar API Key"}
              </button>
            </div>
          )}
        </div>

        {/* Webhook endpoint */}
        {integration && (
          <div className="card-3d-sm p-6 fade-up">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#1e3a4a" }}>🌐 Endpoint do Webhook</h2>
            <code className="block text-xs px-3 py-2.5 rounded-lg font-mono mb-3"
              style={{ background: "rgba(91,158,201,0.08)", color: "#1e3a4a", wordBreak: "break-all" }}>
              POST {webhookUrl}
            </code>
            <p className="text-xs mb-3" style={{ color: "#7a9aaa" }}>
              Envie o header <code className="text-xs px-1 rounded" style={{ background: "rgba(91,158,201,0.1)" }}>x-api-key: SUA_CHAVE</code>
            </p>

            <h3 className="text-xs font-semibold mb-2" style={{ color: "#1e3a4a" }}>Payload esperado:</h3>
            <pre className="text-xs p-3 rounded-lg overflow-x-auto"
              style={{ background: "rgba(30,58,74,0.05)", color: "#3a5a6a", lineHeight: 1.7 }}>
{`[
  {
    "name": "João Silva",
    "email": "joao@empresa.com",
    "sector": "TI",
    "jobTitle": "Analista de Sistemas"
  },
  {
    "name": "Maria Santos",
    "email": "maria@empresa.com",
    "sector": "RH",
    "jobTitle": "Gerente de RH"
  }
]`}
            </pre>
            <p className="text-xs mt-3" style={{ color: "#aac0cc" }}>
              Funcionários existentes só são atualizados dentro do mesmo tenant. Novos registros recebem PIN aleatório e exigem provisionamento seguro fora do webhook.
            </p>
          </div>
        )}

        {/* Last sync log */}
        {integration?.syncLog && (
          <div className="card-3d-sm p-6 fade-up">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#1e3a4a" }}>📊 Último relatório de sincronização</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Criados", value: integration.syncLog.created, color: "#5baa6d" },
                { label: "Atualizados", value: integration.syncLog.updated, color: "#2e7fa3" },
                { label: "Erros", value: integration.syncLog.errors.length, color: "#dc2626" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: `${s.color}10` }}>
                  <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#7a9aaa" }}>{s.label}</div>
                </div>
              ))}
            </div>
            {integration.syncLog.errors.length > 0 && (
              <div className="space-y-1">
                {integration.syncLog.errors.map((e, i) => (
                  <p key={i} className="text-xs" style={{ color: "#dc2626" }}>• {e}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Role info */}
        <div className="card-3d-sm p-5 fade-up" style={{ background: "rgba(91,158,201,0.03)" }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "#1e3a4a" }}>👥 Papéis disponíveis</h2>
          <div className="space-y-2">
            {[
              { role: "ADMIN", desc: "Acesso total à empresa — cria campanhas, gerencia usuários" },
              { role: "HR", desc: "Importa funcionários, visualiza todos os setores" },
              { role: "MANAGER", desc: "Vê apenas os dados do seu próprio setor" },
              { role: "EMPLOYEE", desc: "Responde questionários, acessa o portal pessoal" },
            ].map((r) => (
              <div key={r.role} className="flex items-start gap-3 rounded-xl px-3 py-2.5"
                style={{ background: "rgba(91,158,201,0.05)", border: "1px solid rgba(91,158,201,0.1)" }}>
                <code className="text-xs font-mono font-bold shrink-0" style={{ color: "#2e7fa3" }}>{r.role}</code>
                <p className="text-xs" style={{ color: "#5a7a8a" }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ConsultorTenantShell>
  );
}

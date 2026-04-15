"use client";
/**
 * <DevQuickLogin /> — atalho de login para desenvolvimento.
 *
 * Não é um bypass de autenticação real: o componente apenas chama o endpoint
 * de login normal com as credenciais demo seedadas. A vantagem é evitar o
 * trabalho repetitivo de digitar email/senha durante QA local.
 *
 * Dupla proteção pra nunca aparecer em produção:
 *   1. `process.env.NODE_ENV !== "production"` (build-time, removido por
 *      tree-shaking em produção)
 *   2. `process.env.NEXT_PUBLIC_ENABLE_DEV_BYPASS === "true"` (opt-in
 *      explícito no `.env` local)
 *
 * Para habilitar localmente, adicione no seu `.env`:
 *
 *   NEXT_PUBLIC_ENABLE_DEV_BYPASS=true
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type DevQuickLoginPreset = {
  /** Texto do botão. */
  label: string;
  /** Subtítulo (geralmente as credenciais visíveis). */
  description?: string;
  request: {
    url: string;
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
  };
  /**
   * Caminho para navegar após sucesso. Pode ser uma string fixa ou uma
   * função que recebe o JSON da resposta (útil para o fluxo do colaborador,
   * onde precisamos do `campaign.id` retornado).
   */
  redirect: string | ((data: unknown) => string);
};

export default function DevQuickLogin({
  presets,
}: {
  presets: DevQuickLoginPreset[];
}) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Avaliado no client após hidratação para evitar mismatch SSR.
    const isDev = process.env.NODE_ENV !== "production";
    const flagOn = process.env.NEXT_PUBLIC_ENABLE_DEV_BYPASS === "true";
    setEnabled(isDev && flagOn);
  }, []);

  if (!enabled) return null;

  async function loginAs(preset: DevQuickLoginPreset) {
    setLoading(preset.label);
    setError(null);
    try {
      const method = preset.request.method ?? "POST";
      const init: RequestInit = {
        method,
        headers: { "Content-Type": "application/json" },
      };
      if (method === "POST" && preset.request.body) {
        init.body = JSON.stringify(preset.request.body);
      }
      const res = await fetch(preset.request.url, init);
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg =
          (data as { error?: string }).error ?? `HTTP ${res.status}`;
        setError(errMsg);
        return;
      }
      const target =
        typeof preset.redirect === "function"
          ? preset.redirect(data)
          : preset.redirect;
      router.push(target);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div
      role="region"
      aria-label="Atalhos de login para desenvolvimento"
      className="mt-4 rounded-2xl border-2 border-dashed p-4"
      style={{ borderColor: "#fbbf24", background: "#fffbeb" }}
    >
      <p
        className="text-xs font-bold uppercase mb-1 flex items-center gap-1.5"
        style={{ color: "#92400e" }}
      >
        <span aria-hidden="true">⚡</span> Dev only — login rápido
      </p>
      <p className="text-[10px] mb-3" style={{ color: "#a16207" }}>
        Visível só com NEXT_PUBLIC_ENABLE_DEV_BYPASS=true em desenvolvimento.
      </p>
      <div className="space-y-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => loginAs(preset)}
            disabled={loading !== null}
            className="w-full text-left text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:cursor-not-allowed"
            style={{
              background: loading === preset.label ? "#fde68a" : "#fef3c7",
              color: "#92400e",
              opacity: loading !== null && loading !== preset.label ? 0.5 : 1,
            }}
          >
            {loading === preset.label ? "Entrando…" : preset.label}
            {preset.description && (
              <span className="block text-[10px] font-mono font-normal opacity-80 mt-0.5">
                {preset.description}
              </span>
            )}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-xs mt-2" style={{ color: "#dc2626" }}>
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

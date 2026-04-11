"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DevQuickLogin from "@/components/DevQuickLogin";

export default function AcessoColaboradorPage() {
  const router = useRouter();
  const [empresa, setEmpresa] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!empresa.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/acesso/colaborador?empresa=${encodeURIComponent(empresa.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao buscar empresa.");
        return;
      }

      router.push(`/questionario?campaign=${data.campaign.id}`);
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen gradient-hero flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full fade-up">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Image
            src="https://all-livesocupacional.com.br/wp-content/uploads/2025/01/AllLivesPreferencial-copiar.png.webp"
            alt="All Lives"
            width={160}
            height={50}
            className="object-contain"
            unoptimized
          />
        </div>

        <div className="card-3d p-8 mb-4">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: "rgba(46,127,163,0.08)", border: "1.5px solid rgba(46,127,163,0.2)" }}>
              <svg className="w-4 h-4" style={{ color: "#2e7fa3" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs font-semibold" style={{ color: "#2e7fa3" }}>Acesso Colaborador</span>
            </div>
          </div>

          <h1 className="text-xl font-bold mb-1 text-center" style={{ color: "#1e3a4a" }}>
            Qual é a sua empresa?
          </h1>
          <p className="text-sm text-center mb-7" style={{ color: "#7a9aaa" }}>
            Digite o nome da empresa para acessar a pesquisa
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>
                Nome da empresa
              </label>
              <input
                type="text"
                value={empresa}
                onChange={e => { setEmpresa(e.target.value); setError(""); }}
                placeholder="Ex: Empresa ABC"
                autoFocus
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ border: "1.5px solid #e2edf4", background: "#f8fbfd", color: "#1e3a4a" }}
                onFocus={e => { e.target.style.borderColor = "#5b9ec9"; e.target.style.boxShadow = "0 0 0 3px rgba(91,158,201,0.15)"; }}
                onBlur={e  => { e.target.style.borderColor = error ? "#ef4444" : "#e2edf4"; e.target.style.boxShadow = "none"; }}
              />
              {error && (
                <p className="mt-2 text-xs flex items-start gap-1.5" style={{ color: "#dc2626" }}>
                  <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!empresa.trim() || loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
              style={{ opacity: !empresa.trim() || loading ? 0.6 : 1 }}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Buscando...
                </>
              ) : (
                <>
                  Acessar pesquisa
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <DevQuickLogin
            presets={[
              {
                label: "Ir direto para o questionário demo",
                description: "Empresa Demo Ltda → campaign-demo",
                request: {
                  url: "/api/acesso/colaborador?empresa=Demo",
                  method: "GET",
                },
                redirect: (data) => {
                  const campaignId = (
                    data as { campaign?: { id?: string } }
                  )?.campaign?.id;
                  return campaignId
                    ? `/questionario?campaign=${campaignId}`
                    : "/questionario";
                },
              },
            ]}
          />

          {/* Anonimato */}
          <div className="mt-6 rounded-xl p-3 flex items-start gap-3"
            style={{ background: "rgba(91,170,109,0.07)", border: "1.5px solid rgba(91,170,109,0.2)" }}>
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#5baa6d" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-xs leading-relaxed" style={{ color: "#3d8a50" }}>
              <span className="font-semibold">Suas respostas são 100% anônimas.</span> Nenhum dado pessoal é solicitado ou armazenado.
            </p>
          </div>
        </div>

        <Link href="/login" className="block text-center text-sm py-2 transition-colors"
          style={{ color: "#aac0cc" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#2e7fa3")}
          onMouseLeave={e => (e.currentTarget.style.color = "#aac0cc")}>
          ← Voltar
        </Link>
      </div>
    </main>
  );
}

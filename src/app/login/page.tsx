"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Tab = "colaborador" | "empresa" | "admin";

const TABS: { key: Tab; label: string; color: string; colorBg: string; colorBorder: string; icon: React.ReactNode }[] = [
  {
    key: "colaborador",
    label: "Colaborador",
    color: "#2e7fa3",
    colorBg: "rgba(46,127,163,0.08)",
    colorBorder: "rgba(46,127,163,0.3)",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    key: "empresa",
    label: "Empresa",
    color: "#5baa6d",
    colorBg: "rgba(91,170,109,0.08)",
    colorBorder: "rgba(91,170,109,0.3)",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    key: "admin",
    label: "Administração",
    color: "#dc2626",
    colorBg: "rgba(220,38,38,0.08)",
    colorBorder: "rgba(220,38,38,0.25)",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("colaborador");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Colaborador
  const [empresa, setEmpresa] = useState("");

  // Empresa
  const [slug, setSlug] = useState("");
  const [empresaPass, setEmpresaPass] = useState("");
  const [showEmpresaPass, setShowEmpresaPass] = useState(false);

  // Admin
  const [email, setEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [showAdminPass, setShowAdminPass] = useState(false);

  function clearError() {
    setError("");
  }

  function switchTab(t: Tab) {
    setTab(t);
    setError("");
  }

  async function handleColaborador(e: React.FormEvent) {
    e.preventDefault();
    if (!empresa.trim()) return;
    setLoading(true);
    clearError();
    try {
      const res = await fetch(`/api/acesso/colaborador?empresa=${encodeURIComponent(empresa.trim())}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao buscar empresa."); return; }
      router.push(`/questionario?campaign=${data.campaign.id}`);
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmpresa(e: React.FormEvent) {
    e.preventDefault();
    if (!slug.trim() || !empresaPass) return;
    setLoading(true);
    clearError();
    try {
      const res = await fetch("/api/acesso/empresa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slug.trim(), password: empresaPass }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao autenticar."); return; }
      router.push("/dashboard");
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !adminPass) return;
    setLoading(true);
    clearError();
    try {
      const res = await fetch("/api/consultor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: adminPass }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Credenciais inválidas."); return; }
      if (!data.ok) { setError(data.error ?? "Credenciais inválidas."); return; }
      router.push("/consultor");
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  const activeTab = TABS.find(t => t.key === tab)!;

  const inputStyle = { border: "1.5px solid #e2edf4", background: "#f8fbfd", color: "#1e3a4a" };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#5b9ec9";
    e.target.style.boxShadow = "0 0 0 3px rgba(91,158,201,0.15)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#e2edf4";
    e.target.style.boxShadow = "none";
  };

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
          <h1 className="text-xl font-bold mb-1 text-center" style={{ color: "#1e3a4a" }}>
            Acessar plataforma
          </h1>
          <p className="text-sm text-center mb-6" style={{ color: "#7a9aaa" }}>
            Selecione o seu perfil para continuar
          </p>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: "#f0f5f9" }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all"
                style={
                  tab === t.key
                    ? { background: "#fff", color: t.color, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                    : { background: "transparent", color: "#7a9aaa" }
                }
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Badge */}
          <div className="flex justify-center mb-5">
            <div
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{ background: activeTab.colorBg, border: `1.5px solid ${activeTab.colorBorder}`, color: activeTab.color }}
            >
              {activeTab.icon}
              {tab === "colaborador" && "Acesso Colaborador"}
              {tab === "empresa" && "Acesso Empresa"}
              {tab === "admin" && "Administração All Lives"}
            </div>
          </div>

          {/* Colaborador form */}
          {tab === "colaborador" && (
            <form onSubmit={handleColaborador} className="space-y-4">
              <p className="text-sm text-center mb-2" style={{ color: "#7a9aaa" }}>
                Digite o nome da empresa para acessar a pesquisa
              </p>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>
                  Nome da empresa
                </label>
                <input
                  type="text"
                  value={empresa}
                  onChange={e => { setEmpresa(e.target.value); clearError(); }}
                  placeholder="Ex: Empresa ABC"
                  autoFocus
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              {error && <ErrorMsg>{error}</ErrorMsg>}

              <button
                type="submit"
                disabled={!empresa.trim() || loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
                style={{ opacity: !empresa.trim() || loading ? 0.6 : 1 }}
              >
                {loading ? <Spinner text="Buscando..." /> : (
                  <>
                    Acessar pesquisa
                    <ArrowIcon />
                  </>
                )}
              </button>

              {/* Anonimato */}
              <div className="mt-2 rounded-xl p-3 flex items-start gap-3"
                style={{ background: "rgba(91,170,109,0.07)", border: "1.5px solid rgba(91,170,109,0.2)" }}>
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#5baa6d" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-xs leading-relaxed" style={{ color: "#3d8a50" }}>
                  <span className="font-semibold">Suas respostas são 100% anônimas.</span> Nenhum dado pessoal é solicitado ou armazenado.
                </p>
              </div>
            </form>
          )}

          {/* Empresa form */}
          {tab === "empresa" && (
            <form onSubmit={handleEmpresa} className="space-y-4">
              <p className="text-sm text-center mb-2" style={{ color: "#7a9aaa" }}>
                Digite o código e a senha fornecidos pela All Lives
              </p>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>
                  Código da empresa
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={e => { setSlug(e.target.value); clearError(); }}
                  placeholder="Ex: empresa-demo"
                  autoFocus
                  autoCapitalize="none"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showEmpresaPass ? "text" : "password"}
                    value={empresaPass}
                    onChange={e => { setEmpresaPass(e.target.value); clearError(); }}
                    placeholder="Senha de acesso"
                    className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                  <TogglePassBtn show={showEmpresaPass} onToggle={() => setShowEmpresaPass(v => !v)} />
                </div>
              </div>

              {error && <ErrorMsg>{error}</ErrorMsg>}

              <button
                type="submit"
                disabled={!slug.trim() || !empresaPass || loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
                style={{ opacity: !slug.trim() || !empresaPass || loading ? 0.6 : 1 }}
              >
                {loading ? <Spinner text="Entrando..." /> : (
                  <>
                    Entrar no painel
                    <ArrowIcon />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Admin form */}
          {tab === "admin" && (
            <form onSubmit={handleAdmin} className="space-y-4">
              <p className="text-sm text-center mb-2" style={{ color: "#7a9aaa" }}>
                Use suas credenciais de administrador
              </p>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearError(); }}
                  placeholder="admin@alllives.com.br"
                  autoFocus
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>Senha</label>
                <div className="relative">
                  <input
                    type={showAdminPass ? "text" : "password"}
                    value={adminPass}
                    onChange={e => { setAdminPass(e.target.value); clearError(); }}
                    placeholder="Senha de administrador"
                    className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                  <TogglePassBtn show={showAdminPass} onToggle={() => setShowAdminPass(v => !v)} />
                </div>
              </div>

              {error && <ErrorMsg>{error}</ErrorMsg>}

              <button
                type="submit"
                disabled={!email || !adminPass || loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
                style={{ opacity: !email || !adminPass || loading ? 0.6 : 1 }}
              >
                {loading ? <Spinner text="Entrando..." /> : (
                  <>
                    Entrar
                    <ArrowIcon />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <Link href="/" className="block text-center text-sm py-2 transition-colors"
          style={{ color: "#aac0cc" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#2e7fa3")}
          onMouseLeave={e => (e.currentTarget.style.color = "#aac0cc")}>
          &larr; Voltar ao início
        </Link>
      </div>
    </main>
  );
}

/* ── Shared small components ── */

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs flex items-start gap-1.5" style={{ color: "#dc2626" }}>
      <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {children}
    </p>
  );
}

function Spinner({ text }: { text: string }) {
  return (
    <>
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      {text}
    </>
  );
}

function ArrowIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function TogglePassBtn({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: "#aac0cc" }}>
      {show ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );
}

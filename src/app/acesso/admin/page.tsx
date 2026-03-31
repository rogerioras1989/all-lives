"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AcessoAdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/consultor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Credenciais inválidas.");
        return;
      }
      router.push("/admin");
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen gradient-hero flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full fade-up">
        <div className="flex justify-center mb-10">
          <Image
            src="https://all-livesocupacional.com.br/wp-content/uploads/2025/01/AllLivesPreferencial-copiar.png.webp"
            alt="All Lives" width={160} height={50} className="object-contain" unoptimized
          />
        </div>

        <div className="card-3d p-8 mb-4">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: "rgba(220,38,38,0.08)", border: "1.5px solid rgba(220,38,38,0.2)" }}>
              <svg className="w-4 h-4" style={{ color: "#dc2626" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs font-semibold" style={{ color: "#dc2626" }}>Administração All Lives</span>
            </div>
          </div>

          <h1 className="text-xl font-bold mb-1 text-center" style={{ color: "#1e3a4a" }}>Acesso restrito</h1>
          <p className="text-sm text-center mb-7" style={{ color: "#7a9aaa" }}>Use suas credenciais de administrador</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>E-mail</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                placeholder="admin@alllives.com.br" autoFocus
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ border: "1.5px solid #e2edf4", background: "#f8fbfd", color: "#1e3a4a" }}
                onFocus={e => { e.target.style.borderColor = "#5b9ec9"; e.target.style.boxShadow = "0 0 0 3px rgba(91,158,201,0.15)"; }}
                onBlur={e  => { e.target.style.borderColor = "#e2edf4"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>Senha</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="Senha de administrador"
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-all"
                  style={{ border: "1.5px solid #e2edf4", background: "#f8fbfd", color: "#1e3a4a" }}
                  onFocus={e => { e.target.style.borderColor = "#5b9ec9"; e.target.style.boxShadow = "0 0 0 3px rgba(91,158,201,0.15)"; }}
                  onBlur={e  => { e.target.style.borderColor = "#e2edf4"; e.target.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: "#aac0cc" }}>
                  {showPass
                    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs flex items-start gap-1.5" style={{ color: "#dc2626" }}>
                <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            )}

            <button type="submit" disabled={!email || !password || loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
              style={{ opacity: !email || !password || loading ? 0.6 : 1 }}>
              {loading
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Entrando...</>
                : <>Entrar<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></>
              }
            </button>
          </form>
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

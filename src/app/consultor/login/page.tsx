"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import DevQuickLogin from "@/components/DevQuickLogin";

export default function ConsultorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/consultor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.ok) {
        router.push("/consultor");
      } else {
        setError(data.error || "Erro ao entrar");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen gradient-hero flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image
            src="https://all-livesocupacional.com.br/wp-content/uploads/2025/01/AllLivesPreferencial-copiar.png.webp"
            alt="All Lives" width={140} height={44} className="object-contain" unoptimized
          />
        </div>

        <div className="card-3d p-8 fade-up">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(91,158,201,0.1)", color: "#1e5f7a" }}>
              🏢 Acesso Consultor All Lives
            </div>
            <h2 className="text-xl font-bold" style={{ color: "#1e3a4a" }}>Entrar no painel</h2>
            <p className="text-xs mt-1" style={{ color: "#7a9aaa" }}>Gerencie todas as empresas clientes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#3a5a6a" }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="consultor@alllives.com.br"
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ borderColor: "rgba(91,158,201,0.3)", background: "#f8fbfd", color: "#1e3a4a" }}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#3a5a6a" }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ borderColor: "rgba(91,158,201,0.3)", background: "#f8fbfd", color: "#1e3a4a" }}
              />
            </div>

            {error && (
              <p className="text-xs" style={{ color: "#dc2626" }}>{error}</p>
            )}

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <DevQuickLogin
            presets={[
              {
                label: "Entrar como Consultor demo",
                description: "consultor@alllives.com.br / consultor123",
                request: {
                  url: "/api/consultor/login",
                  method: "POST",
                  body: {
                    email: "consultor@alllives.com.br",
                    password: "consultor123",
                  },
                },
                redirect: "/consultor",
              },
            ]}
          />
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#aac0cc" }}>
          Acesso restrito à equipe All Lives · LGPD
        </p>
      </div>
    </main>
  );
}

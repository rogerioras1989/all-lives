"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Campaign = {
  id: string;
  title: string;
  status: string;
  slug: string;
  createdAt: string;
};

type Company = {
  id: string;
  name: string;
  cnpj: string | null;
  slug: string;
  role: string;
  totalUsers: number;
  campaigns: Campaign[];
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativa",
  CLOSED: "Encerrada",
  ARCHIVED: "Arquivada",
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "#7a9aaa",
  ACTIVE: "#5baa6d",
  CLOSED: "#f59e0b",
  ARCHIVED: "#9ca3af",
};

export default function ConsultorPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/consultor/companies")
      .then((r) => {
        if (r.status === 401) { router.push("/consultor/login"); return null; }
        return r.json();
      })
      .then((d) => {
        if (d) setCompanies(d.companies ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.cnpj ?? "").includes(search)
  );

  if (loading) {
    return (
      <main className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: "#2e7fa3", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "#7a9aaa" }}>Carregando empresas...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen gradient-hero pb-16">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md border-b border-white/60 sticky top-0 z-20"
        style={{ boxShadow: "0 1px 12px rgba(30,95,122,0.08)" }}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="https://all-livesocupacional.com.br/wp-content/uploads/2025/01/AllLivesPreferencial-copiar.png.webp"
              alt="All Lives" width={110} height={35} className="object-contain" unoptimized
            />
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(91,158,201,0.12)", color: "#1e5f7a" }}>
              Painel Consultor
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="btn-ghost text-xs px-3 py-2">← Home</Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-8">
        {/* Summary bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { icon: "🏢", value: companies.length, label: "Empresas" },
            { icon: "📋", value: companies.reduce((a, c) => a + c.campaigns.length, 0), label: "Campanhas" },
            { icon: "👥", value: companies.reduce((a, c) => a + c.totalUsers, 0), label: "Funcionários" },
            { icon: "✅", value: companies.reduce((a, c) => a + c.campaigns.filter(x => x.status === "ACTIVE").length, 0), label: "Campanhas Ativas" },
          ].map((s) => (
            <div key={s.label} className="card-3d-sm p-5 text-center fade-up">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold" style={{ color: "#1e5f7a" }}>{s.value}</div>
              <div className="text-xs font-medium mt-0.5" style={{ color: "#7a9aaa" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Health overview */}
        <div className="card-3d-sm p-5 mb-8 fade-up">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🩺</span>
            <h2 className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>Visão Geral de Saúde</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Com campanha ativa",
                value: companies.filter((c) => c.campaigns.some((x) => x.status === "ACTIVE")).length,
                total: companies.length,
                color: "#5baa6d",
                bg: "rgba(91,170,109,0.08)",
              },
              {
                label: "Sem campanha",
                value: companies.filter((c) => c.campaigns.length === 0).length,
                total: companies.length,
                color: "#9ca3af",
                bg: "rgba(107,114,128,0.08)",
              },
              {
                label: "Campanhas encerradas",
                value: companies.reduce((a, c) => a + c.campaigns.filter(x => x.status === "CLOSED").length, 0),
                total: companies.reduce((a, c) => a + c.campaigns.length, 0),
                color: "#f59e0b",
                bg: "rgba(245,158,11,0.08)",
              },
              {
                label: "Total de funcionários",
                value: companies.reduce((a, c) => a + c.totalUsers, 0),
                total: null,
                color: "#2e7fa3",
                bg: "rgba(46,127,163,0.08)",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-4" style={{ background: item.bg, border: `1px solid ${item.color}22` }}>
                <div className="text-xl font-bold mb-0.5" style={{ color: item.color }}>{item.value}</div>
                <div className="text-xs" style={{ color: "#7a9aaa" }}>
                  {item.label}
                  {item.total !== null && <span style={{ color: item.color }}> / {item.total}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar empresa por nome ou CNPJ…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 text-sm outline-none"
            style={{ borderColor: "rgba(91,158,201,0.25)", background: "white", color: "#1e3a4a" }}
          />
        </div>

        {/* Company cards */}
        <div className="space-y-4">
          {filtered.length === 0 && (
            <div className="card-3d p-12 text-center">
              <div className="text-4xl mb-3">🏢</div>
              <p style={{ color: "#7a9aaa" }}>Nenhuma empresa encontrada</p>
            </div>
          )}

          {filtered.map((company) => (
            <div key={company.id} className="card-3d-sm overflow-hidden fade-up">
              {/* Company header */}
              <button
                className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors hover:bg-blue-50/30"
                onClick={() => setExpanded(expanded === company.id ? null : company.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                    style={{ background: "rgba(46,127,163,0.12)", color: "#2e7fa3" }}>
                    {company.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: "#1e3a4a" }}>
                      {company.name}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "#7a9aaa" }}>
                      {company.cnpj ?? "CNPJ não informado"} · {company.totalUsers} funcionários
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(91,170,109,0.1)", color: "#3d8a50" }}>
                    {company.campaigns.filter((c) => c.status === "ACTIVE").length} ativa(s)
                  </span>
                  <span style={{ color: "#7a9aaa", fontSize: 16 }}>
                    {expanded === company.id ? "▲" : "▼"}
                  </span>
                </div>
              </button>

              {/* Expanded campaigns */}
              {expanded === company.id && (
                <div className="border-t px-6 py-4" style={{ borderColor: "rgba(91,158,201,0.1)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7a9aaa" }}>
                      Campanhas
                    </p>
                    <div className="flex gap-2">
                      <Link
                        href={`/consultor/empresas/${company.id}/importar`}
                        className="btn-ghost text-xs px-3 py-1.5"
                      >
                        📤 Importar CSV
                      </Link>
                      <Link
                        href={`/consultor/empresas/${company.id}`}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        Ver painel →
                      </Link>
                    </div>
                  </div>

                  {company.campaigns.length === 0 ? (
                    <p className="text-xs py-3" style={{ color: "#aac0cc" }}>
                      Nenhuma campanha criada
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {company.campaigns.map((c) => (
                        <div key={c.id}
                          className="flex items-center justify-between rounded-xl px-4 py-3"
                          style={{ background: "rgba(91,158,201,0.05)", border: "1px solid rgba(91,158,201,0.12)" }}>
                          <div>
                            <span className="text-sm font-medium" style={{ color: "#1e3a4a" }}>
                              {c.title}
                            </span>
                            <span className="text-xs ml-2" style={{ color: "#7a9aaa" }}>
                              /r/{c.slug}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                background: `${STATUS_COLOR[c.status]}20`,
                                color: STATUS_COLOR[c.status],
                              }}>
                              {STATUS_LABEL[c.status]}
                            </span>
                            <Link
                              href={`/consultor/empresas/${company.id}?campaign=${c.id}`}
                              className="text-xs font-medium"
                              style={{ color: "#2e7fa3" }}
                            >
                              Dashboard →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

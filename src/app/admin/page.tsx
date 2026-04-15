"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Stats = { companies: number; campaigns: number; activeCampaigns: number; responses: number; consultants: number };

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => { if (r.status === 401 || r.status === 403) { router.push("/login"); return null; } return r.json(); })
      .then(d => d && setStats(d))
      .catch(() => setError("Erro ao carregar."));
  }, [router]);

  const cards = stats ? [
    { label: "Empresas",          value: stats.companies,       icon: "🏢", href: "/admin/empresas",    color: "#2e7fa3" },
    { label: "Campanhas ativas",  value: stats.activeCampaigns, icon: "📋", href: "/admin/empresas",    color: "#5baa6d" },
    { label: "Total de campanhas",value: stats.campaigns,       icon: "📁", href: "/admin/empresas",    color: "#f59e0b" },
    { label: "Respostas",         value: stats.responses,       icon: "✅", href: "/admin/empresas",    color: "#8b5cf6" },
    { label: "Consultores",       value: stats.consultants,     icon: "👤", href: "/admin/consultores", color: "#ec4899" },
  ] : [];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold" style={{ color: "#1e3a4a" }}>Visão Geral</h2>
        <p className="text-sm mt-1" style={{ color: "#7a9aaa" }}>Resumo de toda a plataforma</p>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {!stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card-3d p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
              <div className="h-8 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {cards.map(c => (
            <Link key={c.label} href={c.href}
              className="card-3d p-6 block transition-all hover:scale-[1.02]">
              <div className="text-2xl mb-2">{c.icon}</div>
              <div className="text-3xl font-bold mb-1" style={{ color: c.color }}>{c.value}</div>
              <div className="text-xs font-medium" style={{ color: "#7a9aaa" }}>{c.label}</div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/empresas"
          className="card-3d p-6 flex items-center gap-4 transition-all hover:scale-[1.01]">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "rgba(46,127,163,0.1)" }}>🏢</div>
          <div>
            <div className="font-semibold" style={{ color: "#1e3a4a" }}>Gerenciar Empresas</div>
            <div className="text-xs mt-0.5" style={{ color: "#7a9aaa" }}>Criar, editar e ver campanhas por empresa</div>
          </div>
          <svg className="w-5 h-5 ml-auto" style={{ color: "#aac0cc" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link href="/admin/consultores"
          className="card-3d p-6 flex items-center gap-4 transition-all hover:scale-[1.01]">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "rgba(91,170,109,0.1)" }}>👤</div>
          <div>
            <div className="font-semibold" style={{ color: "#1e3a4a" }}>Gerenciar Consultores</div>
            <div className="text-xs mt-0.5" style={{ color: "#7a9aaa" }}>Criar e remover acessos de consultores</div>
          </div>
          <svg className="w-5 h-5 ml-auto" style={{ color: "#aac0cc" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

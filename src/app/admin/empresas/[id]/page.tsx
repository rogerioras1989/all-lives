"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Campaign = { id: string; title: string; status: string; createdAt: string; _count: { responses: number } };
type Company = {
  id: string; name: string; slug: string; createdAt: string;
  _count: { users: number };
  campaigns: Campaign[];
};

const STATUS_LABEL: Record<string, string> = { DRAFT: "Rascunho", ACTIVE: "Aberta", CLOSED: "Encerrada", ARCHIVED: "Arquivada" };
const STATUS_COLOR: Record<string, string> = { DRAFT: "#9ca3af", ACTIVE: "#5baa6d", CLOSED: "#f59e0b", ARCHIVED: "#d1d5db" };

function genPassword(len = 12) {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function AdminEmpresaDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    fetch(`/api/admin/empresas/${id}`)
      .then(r => { if (r.status === 401 || r.status === 403) { router.push("/acesso/admin"); return null; } return r.json(); })
      .then(d => { if (d) { setCompany(d); setEditName(d.name); setEditSlug(d.slug); } })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaveMsg("");
    const body: Record<string, string> = { name: editName, slug: editSlug };
    if (newPassword) body.password = newPassword;
    const res = await fetch(`/api/admin/empresas/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      setCompany(prev => prev ? { ...prev, name: data.name, slug: data.slug } : prev);
      setSaveMsg(newPassword ? "Salvo! Nova senha definida." : "Salvo!");
      setNewPassword("");
    } else {
      setSaveMsg(data.error ?? "Erro ao salvar.");
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  }

  if (loading) return <div className="card-3d p-12 text-center animate-pulse" style={{ color: "#aac0cc" }}>Carregando...</div>;
  if (!company) return <div className="card-3d p-12 text-center" style={{ color: "#7a9aaa" }}>Empresa não encontrada.</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/empresas" className="btn-ghost px-3 py-2 text-sm flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Empresas
        </Link>
        <span style={{ color: "#aac0cc" }}>/</span>
        <h2 className="text-xl font-bold" style={{ color: "#1e3a4a" }}>{company.name}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit form */}
        <div className="card-3d p-6">
          <h3 className="font-bold text-sm mb-4" style={{ color: "#1e5f7a" }}>Dados da empresa</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>Nome</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ border: "1.5px solid #e2edf4", background: "#f8fbfd", color: "#1e3a4a" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>Código (slug)</label>
              <input value={editSlug} onChange={e => setEditSlug(e.target.value)} required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none font-mono"
                style={{ border: "1.5px solid #e2edf4", background: "#f8fbfd", color: "#1e3a4a" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>
                Nova senha <span style={{ color: "#aac0cc" }}>(deixe vazio para manter)</span>
              </label>
              <div className="flex gap-2">
                <input value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Nova senha..."
                  className="flex-1 rounded-xl px-4 py-3 text-sm outline-none font-mono"
                  style={{ border: "1.5px solid #e2edf4", background: "#f8fbfd", color: "#1e3a4a" }} />
                <button type="button" onClick={() => setNewPassword(genPassword())}
                  className="btn-ghost px-3 text-xs rounded-xl" title="Gerar">🔄</button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving} className="btn-primary px-5 py-2.5 text-sm">
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
              {saveMsg && (
                <span className="text-xs font-medium" style={{ color: saveMsg.includes("Erro") ? "#dc2626" : "#5baa6d" }}>
                  {saveMsg}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Stats */}
        <div className="card-3d p-6">
          <h3 className="font-bold text-sm mb-4" style={{ color: "#1e5f7a" }}>Resumo</h3>
          <div className="space-y-3">
            {[
              { label: "Total de campanhas", value: company.campaigns.length },
              { label: "Campanhas ativas",   value: company.campaigns.filter(c => c.status === "ACTIVE").length },
              { label: "Total de respostas", value: company.campaigns.reduce((s, c) => s + c._count.responses, 0) },
              { label: "Usuários cadastrados", value: company._count.users },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center py-2 border-b" style={{ borderColor: "#f0f4f7" }}>
                <span className="text-sm" style={{ color: "#5a7a8a" }}>{s.label}</span>
                <span className="font-bold text-sm" style={{ color: "#1e3a4a" }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaigns */}
      <div className="mt-6 card-3d p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm" style={{ color: "#1e5f7a" }}>Campanhas</h3>
          <Link href={`/consultor/empresas/${company.id}`}
            className="text-xs font-medium flex items-center gap-1 transition-colors"
            style={{ color: "#2e7fa3" }}>
            Ver no painel consultor
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {company.campaigns.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "#aac0cc" }}>Nenhuma campanha criada.</p>
        ) : (
          <div className="space-y-2">
            {company.campaigns.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "#f8fbfd", border: "1px solid #e8f0f5" }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLOR[c.status] }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "#1e3a4a" }}>{c.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#aac0cc" }}>
                    {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold" style={{ color: "#2e7fa3" }}>{c._count.responses} respostas</div>
                  <div className="text-[10px]" style={{ color: STATUS_COLOR[c.status] }}>{STATUS_LABEL[c.status]}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

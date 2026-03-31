"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Consultant = {
  id: string; name: string; email: string; globalRole: string;
  lastLoginAt: string | null; createdAt: string;
  _count: { companies: number };
};

const ROLE_LABEL: Record<string, string> = { OWNER: "Admin", CONSULTANT: "Consultor", ANALYST: "Analista" };
const ROLE_COLOR: Record<string, string> = { OWNER: "#dc2626", CONSULTANT: "#2e7fa3", ANALYST: "#5baa6d" };

function genPassword(len = 12) {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function AdminConsultoresPage() {
  const router = useRouter();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: genPassword(), globalRole: "CONSULTANT" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/consultores")
      .then(r => { if (r.status === 401 || r.status === 403) { router.push("/acesso/admin"); return null; } return r.json(); })
      .then(d => d && setConsultants(d))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormError("");
    const res = await fetch("/api/admin/consultores", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error); setSaving(false); return; }
    setConsultants(prev => [data, ...prev]);
    setShowForm(false);
    setForm({ name: "", email: "", password: genPassword(), globalRole: "CONSULTANT" });
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este consultor?")) return;
    setDeletingId(id);
    await fetch(`/api/admin/consultores/${id}`, { method: "DELETE" });
    setConsultants(prev => prev.filter(c => c.id !== id));
    setDeletingId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#1e3a4a" }}>Consultores</h2>
          <p className="text-sm mt-1" style={{ color: "#7a9aaa" }}>{consultants.length} consultor{consultants.length !== 1 ? "es" : ""}</p>
        </div>
        <button onClick={() => { setShowForm(true); setFormError(""); }}
          className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo consultor
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="card-3d p-8 w-full max-w-md fade-up">
            <h3 className="text-lg font-bold mb-6" style={{ color: "#1e3a4a" }}>Novo Consultor</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>Nome</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nome completo" required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ border: "1.5px solid #e2edf4", background: "#f8fbfd", color: "#1e3a4a" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>E-mail</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@exemplo.com" required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ border: "1.5px solid #e2edf4", background: "#f8fbfd", color: "#1e3a4a" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>Perfil</label>
                <select value={form.globalRole} onChange={e => setForm(f => ({ ...f, globalRole: e.target.value }))}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ border: "1.5px solid #e2edf4", background: "#f8fbfd", color: "#1e3a4a" }}>
                  <option value="CONSULTANT">Consultor</option>
                  <option value="ANALYST">Analista</option>
                  <option value="OWNER">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>Senha inicial</label>
                <div className="flex gap-2">
                  <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required className="flex-1 rounded-xl px-4 py-3 text-sm outline-none font-mono"
                    style={{ border: "1.5px solid #e2edf4", background: "#f8fbfd", color: "#1e3a4a" }} />
                  <button type="button" onClick={() => setForm(f => ({ ...f, password: genPassword() }))}
                    className="btn-ghost px-3 text-xs rounded-xl">🔄</button>
                </div>
                <p className="text-[10px] mt-1" style={{ color: "#aac0cc" }}>Guarde esta senha.</p>
              </div>

              {formError && <p className="text-xs text-red-500">{formError}</p>}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="btn-ghost flex-1 py-2.5 text-sm">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 text-sm">
                  {saving ? "Criando..." : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card-3d p-5 animate-pulse h-20" />)}
        </div>
      ) : consultants.length === 0 ? (
        <div className="card-3d p-12 text-center">
          <div className="text-3xl mb-3">👤</div>
          <p className="text-sm" style={{ color: "#7a9aaa" }}>Nenhum consultor cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {consultants.map(c => (
            <div key={c.id} className="card-3d p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                style={{ background: ROLE_COLOR[c.globalRole] ?? "#7a9aaa" }}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm" style={{ color: "#1e3a4a" }}>{c.name}</div>
                <div className="text-xs mt-0.5" style={{ color: "#aac0cc" }}>{c.email}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[10px] font-bold px-2 py-0.5 rounded-full mb-1"
                  style={{ background: `${ROLE_COLOR[c.globalRole]}15`, color: ROLE_COLOR[c.globalRole] }}>
                  {ROLE_LABEL[c.globalRole]}
                </div>
                <div className="text-[10px]" style={{ color: "#aac0cc" }}>
                  {c._count.companies} empresa{c._count.companies !== 1 ? "s" : ""}
                </div>
              </div>
              <button onClick={() => handleDelete(c.id)} disabled={deletingId === c.id}
                className="btn-ghost px-2 py-2 text-xs rounded-xl flex-shrink-0"
                style={{ color: "#aac0cc" }} title="Remover">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

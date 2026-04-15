"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Company = {
  id: string; name: string; slug: string; createdAt: string;
  _count: { campaigns: number; users: number };
  campaigns: { id: string; title: string }[];
};

function slugify(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function genPassword(len = 12) {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function AdminEmpresasPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", password: genPassword() });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/empresas")
      .then(r => { if (r.status === 401 || r.status === 403) { router.push("/login"); return null; } return r.json(); })
      .then(d => d && setCompanies(d))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormError("");
    const res = await fetch("/api/admin/empresas", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error); setSaving(false); return; }
    setCompanies(prev => [data, ...prev]);
    setShowForm(false);
    setForm({ name: "", slug: "", password: genPassword() });
    setSaving(false);
  }

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#1e3a4a" }}>Empresas</h2>
          <p className="text-sm mt-1" style={{ color: "#7a9aaa" }}>{companies.length} empresa{companies.length !== 1 ? "s" : ""} cadastrada{companies.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => { setShowForm(true); setFormError(""); }}
          className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nova empresa
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar empresa..."
          className="w-full max-w-sm rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
          style={{ border: "1.5px solid #e2edf4", background: "#f8fbfd", color: "#1e3a4a" }}
          onFocus={e => { e.target.style.borderColor = "#5b9ec9"; }}
          onBlur={e  => { e.target.style.borderColor = "#e2edf4"; }}
        />
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="card-3d p-8 w-full max-w-md fade-up">
            <h3 className="text-lg font-bold mb-6" style={{ color: "#1e3a4a" }}>Nova Empresa</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>Nome da empresa</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
                  placeholder="Ex: Empresa ABC Ltda" required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ border: "1.5px solid #e2edf4", background: "#f8fbfd", color: "#1e3a4a" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>Código (slug)</label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="empresa-abc" required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none font-mono"
                  style={{ border: "1.5px solid #e2edf4", background: "#f8fbfd", color: "#1e3a4a" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>Senha de acesso</label>
                <div className="flex gap-2">
                  <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required className="flex-1 rounded-xl px-4 py-3 text-sm outline-none font-mono"
                    style={{ border: "1.5px solid #e2edf4", background: "#f8fbfd", color: "#1e3a4a" }} />
                  <button type="button" onClick={() => setForm(f => ({ ...f, password: genPassword() }))}
                    className="btn-ghost px-3 text-xs rounded-xl" title="Gerar nova senha">🔄</button>
                </div>
                <p className="text-[10px] mt-1" style={{ color: "#aac0cc" }}>Guarde esta senha — não será exibida novamente.</p>
              </div>

              {formError && <p className="text-xs text-red-500">{formError}</p>}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="btn-ghost flex-1 py-2.5 text-sm">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 text-sm">
                  {saving ? "Criando..." : "Criar empresa"}
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
      ) : filtered.length === 0 ? (
        <div className="card-3d p-12 text-center">
          <div className="text-3xl mb-3">🏢</div>
          <p className="text-sm" style={{ color: "#7a9aaa" }}>{search ? "Nenhuma empresa encontrada." : "Nenhuma empresa cadastrada ainda."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <Link key={c.id} href={`/admin/empresas/${c.id}`}
              className="card-3d p-5 flex items-center gap-4 block transition-all hover:scale-[1.005]">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(46,127,163,0.1)" }}>
                <span className="text-lg">🏢</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate" style={{ color: "#1e3a4a" }}>{c.name}</div>
                <div className="text-xs mt-0.5 font-mono" style={{ color: "#aac0cc" }}>{c.slug}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-semibold" style={{ color: "#2e7fa3" }}>{c._count.campaigns} campanha{c._count.campaigns !== 1 ? "s" : ""}</div>
                {c.campaigns[0] && (
                  <div className="text-[10px] mt-0.5 px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(91,170,109,0.12)", color: "#5baa6d" }}>ativa</div>
                )}
              </div>
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: "#aac0cc" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

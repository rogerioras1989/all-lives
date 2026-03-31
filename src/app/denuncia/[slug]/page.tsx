"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const LOGO = "https://all-livesocupacional.com.br/wp-content/uploads/2025/01/AllLivesPreferencial-copiar.png.webp";

export default function WhistleblowerPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [loading, setLoading] = useState(false);
  const [protocol, setProtocol] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/whistleblower", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companySlug: slug, topic, description, priority }),
      });
      const d = await res.json();
      if (d.protocol) setProtocol(d.protocol);
      else alert(d.error || "Erro ao enviar denúncia");
    } catch (err) {
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  if (protocol) {
    return (
      <main className="min-h-screen gradient-hero flex items-center justify-center p-6">
        <div className="card-3d p-12 text-center max-w-md w-full">
          <div className="text-6xl mb-6">📝</div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#1e3a4a" }}>Denúncia enviada!</h2>
          <p className="text-sm mb-6" style={{ color: "#7a9aaa" }}>
            Seu protocolo para acompanhamento é:
          </p>
          <div className="text-2xl font-mono font-bold p-4 rounded-xl mb-6 select-all" style={{ background: "rgba(91,158,201,0.1)", color: "#2e7fa3" }}>
            {protocol}
          </div>
          <p className="text-xs mb-8" style={{ color: "#dc2626" }}>
            <strong>Importante:</strong> Guarde este código em local seguro. Por ser anônimo, não poderemos recuperar seu acesso se você perder o protocolo.
          </p>
          <div className="flex flex-col gap-3">
            <Link href={`/denuncia/acompanhar?protocol=${protocol}`} className="btn-primary">Acompanhar agora</Link>
            <Link href="/" className="btn-ghost text-sm">Voltar ao início</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen gradient-hero pb-16">
      <header className="bg-white/70 backdrop-blur-md border-b border-white/60 sticky top-0 z-20" style={{ boxShadow: "0 1px 12px rgba(30,95,122,0.08)" }}>
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <Image src={LOGO} alt="All Lives" width={110} height={35} unoptimized />
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>
            Canal Ético e Seguro
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold mb-3" style={{ color: "#1e3a4a" }}>Canal de Denúncias</h1>
          <p className="text-sm leading-relaxed" style={{ color: "#7a9aaa" }}>
            Este é um espaço seguro e totalmente anônimo para relatar condutas inadequadas, assédio, fraudes ou qualquer violação das diretrizes da empresa.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card-3d p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#7a9aaa" }}>Qual o assunto da denúncia?</label>
            <select 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)}
              required
              className="w-full border-2 rounded-xl px-4 py-3 outline-none transition-all focus:ring-4 focus:ring-blue-100"
              style={{ borderColor: "rgba(91,158,201,0.2)" }}
            >
              <option value="">Selecione um tópico...</option>
              <option value="Assédio Moral">Assédio Moral</option>
              <option value="Assédio Sexual">Assédio Sexual</option>
              <option value="Discriminação">Discriminação</option>
              <option value="Fraude ou Corrupção">Fraude ou Corrupção</option>
              <option value="Segurança do Trabalho">Segurança do Trabalho</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#7a9aaa" }}>Relate o ocorrido com o máximo de detalhes</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="O que aconteceu? Quem estava envolvido? Quando e onde?"
              rows={6}
              className="w-full border-2 rounded-xl px-4 py-3 outline-none transition-all focus:ring-4 focus:ring-blue-100 resize-none"
              style={{ borderColor: "rgba(91,158,201,0.2)" }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#7a9aaa" }}>Gravidade percebida</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: "LOW", label: "Baixa", color: "#5baa6d" },
                { val: "MEDIUM", label: "Média", color: "#f59e0b" },
                { val: "HIGH", label: "Alta", color: "#dc2626" },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setPriority(p.val)}
                  className={`py-3 rounded-xl border-2 font-bold text-xs transition-all ${priority === p.val ? "border-transparent text-white shadow-lg scale-105" : "border-gray-100 text-gray-400"}`}
                  style={{ background: priority === p.val ? p.color : "transparent" }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-4 text-lg shadow-xl"
            >
              {loading ? "Enviando..." : "Enviar Denúncia Anônima 🔒"}
            </button>
          </div>
          <p className="text-[10px] text-center" style={{ color: "#aac0cc" }}>
            Seu IP será mascarado e não temos acesso à sua identidade. O anonimato é garantido por criptografia.
          </p>
        </form>
      </div>
    </main>
  );
}

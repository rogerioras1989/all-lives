"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const LOGO = "https://all-livesocupacional.com.br/wp-content/uploads/2025/01/AllLivesPreferencial-copiar.png.webp";

export default function FollowUpPage() {
  const searchParams = useSearchParams();
  const [protocolInput, setProtocolInput] = useState(searchParams.get("protocol") || "");
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchReport = async (p: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/whistleblower/${p}`);
      const d = await res.json();
      if (d.error) alert(d.error);
      else setReport(d);
    } catch (err) {
      alert("Erro ao buscar protocolo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const p = searchParams.get("protocol");
    if (p) fetchReport(p);
  }, [searchParams]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/whistleblower/${report.protocol}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message, sender: "ANONYMOUS" }),
      });
      setMessage("");
      fetchReport(report.protocol);
    } catch (err) {
      alert("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen gradient-hero pb-16">
      <header className="bg-white/70 backdrop-blur-md border-b border-white/60 sticky top-0 z-20" style={{ boxShadow: "0 1px 12px rgba(30,95,122,0.08)" }}>
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <Image src={LOGO} alt="All Lives" width={110} height={35} unoptimized />
          <Link href="/" className="text-xs font-semibold" style={{ color: "#7a9aaa" }}>← Voltar ao início</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 pt-12">
        {!report ? (
          <div className="card-3d p-8 max-w-md mx-auto">
            <h1 className="text-xl font-bold mb-4" style={{ color: "#1e3a4a" }}>Acompanhar Denúncia</h1>
            <p className="text-sm mb-6" style={{ color: "#7a9aaa" }}>Insira seu número de protocolo para ver o status e interagir com o RH/Consultoria.</p>
            <div className="space-y-4">
              <input 
                type="text" 
                value={protocolInput} 
                onChange={(e) => setProtocolInput(e.target.value)}
                placeholder="Ex: 2026-ABCD-EFGH"
                className="w-full border-2 rounded-xl px-4 py-3 font-mono text-center text-lg outline-none"
                style={{ borderColor: "rgba(91,158,201,0.2)" }}
              />
              <button 
                onClick={() => fetchReport(protocolInput)}
                disabled={loading || !protocolInput}
                className="btn-primary w-full py-3"
              >
                {loading ? "Buscando..." : "Ver Status"}
              </button>
            </div>
          </div>
        ) : (
          <div className="fade-up">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7a9aaa" }}>Protocolo: {report.protocol}</p>
                <h1 className="text-2xl font-bold" style={{ color: "#1e3a4a" }}>{report.topic}</h1>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${report.status === "OPEN" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                  Status: {report.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="card-3d-sm p-6" style={{ background: "white" }}>
                  <h3 className="text-xs font-bold uppercase mb-3" style={{ color: "#7a9aaa" }}>Relato Original</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#3a5a6a" }}>{report.description}</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase" style={{ color: "#7a9aaa" }}>Mensagens e Atualizações</h3>
                  {report.messages.length === 0 && (
                    <p className="text-xs italic" style={{ color: "#aac0cc" }}>Aguardando primeira resposta da equipe de ética.</p>
                  )}
                  {report.messages.map((m: any) => (
                    <div key={m.id} className={`flex ${m.sender === "ANONYMOUS" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${m.sender === "ANONYMOUS" ? "bg-[#2e7fa3] text-white rounded-tr-none" : "bg-white border rounded-tl-none border-gray-100 text-[#3a5a6a]"}`}>
                        <p className="text-[10px] font-bold mb-1 uppercase opacity-70">
                          {m.sender === "ANONYMOUS" ? "Você (Anônimo)" : "Equipe All Lives / Empresa"}
                        </p>
                        <p>{m.text}</p>
                        <p className="text-[9px] mt-2 opacity-50 text-right">{new Date(m.createdAt).toLocaleString("pt-BR")}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleReply} className="card-3d-sm p-4 flex gap-3 items-end">
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Adicionar mais informações ou responder..."
                    className="flex-1 bg-transparent border-none outline-none text-sm resize-none py-2"
                    rows={2}
                  />
                  <button 
                    disabled={sending || !message.trim()}
                    className="btn-primary px-6 py-2 text-xs"
                  >
                    {sending ? "..." : "Enviar"}
                  </button>
                </form>
              </div>

              <div className="space-y-6">
                <div className="card-3d-sm p-5 text-center">
                  <p className="text-xs font-medium mb-2" style={{ color: "#7a9aaa" }}>Empresa Relatada</p>
                  <p className="font-bold mb-4" style={{ color: "#1e3a4a" }}>{report.company.name}</p>
                  <div className="p-3 bg-red-50 rounded-xl">
                    <p className="text-[10px] font-bold text-red-700 uppercase mb-1">Prioridade</p>
                    <p className="text-sm font-bold text-red-600">{report.priority}</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border-2 border-dashed border-gray-100 text-center">
                  <p className="text-[10px]" style={{ color: "#aac0cc" }}>
                    Denúncia realizada em<br/>
                    <strong style={{ color: "#7a9aaa" }}>{new Date(report.createdAt).toLocaleDateString("pt-BR")}</strong>
                  </p>
                </div>

                <button onClick={() => { setReport(null); setProtocolInput(""); }} className="w-full btn-ghost text-xs">
                  Sair do Protocolo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

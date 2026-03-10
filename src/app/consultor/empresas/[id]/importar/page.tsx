"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type ImportResult = {
  ok: boolean;
  total: number;
  created: number;
  skipped: number;
  errors: string[];
};

const CSV_TEMPLATE = `cpf,pin,nome,email,setor,cargo
12345678901,123456,João Silva,joao@empresa.com,Tecnologia,Desenvolvedor
98765432100,654321,Maria Santos,maria@empresa.com,RH,Analista de RH
11122233344,111222,Pedro Costa,,Operações,Técnico`;

export default function ImportarPage() {
  const { id } = useParams<{ id: string }>();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(f: File) {
    if (!f.name.endsWith(".csv")) {
      alert("Apenas arquivos .csv são aceitos");
      return;
    }
    setFile(f);
    setResult(null);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/companies/${id}/import-users`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-importacao.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen gradient-hero pb-16">
      <header className="bg-white/70 backdrop-blur-md border-b border-white/60 sticky top-0 z-20"
        style={{ boxShadow: "0 1px 12px rgba(30,95,122,0.08)" }}>
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/consultor" className="text-sm font-medium" style={{ color: "#2e7fa3" }}>
              ← Empresas
            </Link>
            <span style={{ color: "#aac0cc" }}>/</span>
            <span className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>
              Importar Funcionários
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 pt-8">
        <div className="mb-8 fade-up">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#1e3a4a" }}>
            Importar via CSV
          </h1>
          <p className="text-sm" style={{ color: "#7a9aaa" }}>
            Cadastre múltiplos funcionários de uma vez. Os CPFs são automaticamente anonimizados.
          </p>
        </div>

        {/* Template download */}
        <div className="card-3d-sm p-5 mb-6 fade-up">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: "#1e3a4a" }}>
                📋 Formato do arquivo CSV
              </h3>
              <p className="text-xs mb-3" style={{ color: "#7a9aaa" }}>
                Colunas obrigatórias: <strong>cpf</strong>, <strong>pin</strong>. Demais são opcionais.
              </p>
              <div className="font-mono text-xs p-3 rounded-xl overflow-x-auto"
                style={{ background: "rgba(91,158,201,0.06)", color: "#2e7fa3" }}>
                <div>cpf, pin, nome, email, setor, cargo</div>
                <div style={{ color: "#5baa6d" }}>12345678901, 123456, João Silva, ...</div>
              </div>
            </div>
            <button onClick={downloadTemplate} className="btn-ghost text-xs px-4 py-2 whitespace-nowrap">
              ⬇ Baixar modelo
            </button>
          </div>
        </div>

        {/* Drop zone */}
        <div
          className="card-3d-sm mb-6 fade-up"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <div
            className="m-1 rounded-xl border-2 border-dashed transition-all p-10 text-center cursor-pointer"
            style={{
              borderColor: dragOver ? "#2e7fa3" : "rgba(91,158,201,0.3)",
              background: dragOver ? "rgba(46,127,163,0.04)" : "transparent",
            }}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <div className="text-4xl mb-3">📤</div>
            {file ? (
              <>
                <p className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>{file.name}</p>
                <p className="text-xs mt-1" style={{ color: "#7a9aaa" }}>
                  {(file.size / 1024).toFixed(1)} KB · Clique para trocar
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>
                  Arraste o arquivo aqui
                </p>
                <p className="text-xs mt-1" style={{ color: "#7a9aaa" }}>
                  ou clique para selecionar · apenas .csv
                </p>
              </>
            )}
          </div>
        </div>

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="btn-primary w-full mb-8"
        >
          {loading ? "Importando…" : "Importar Funcionários"}
        </button>

        {/* Result */}
        {result && (
          <div className="card-3d-sm p-6 fade-up">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "#1e3a4a" }}>
              {result.ok ? "✅" : "⚠️"} Resultado da Importação
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Total no CSV", value: result.total, color: "#2e7fa3" },
                { label: "Criados", value: result.created, color: "#5baa6d" },
                { label: "Ignorados", value: result.skipped, color: "#f59e0b" },
              ].map((s) => (
                <div key={s.label} className="text-center rounded-xl p-4"
                  style={{ background: `${s.color}10` }}>
                  <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#7a9aaa" }}>{s.label}</div>
                </div>
              ))}
            </div>
            {result.errors.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "#dc2626" }}>
                  Erros ({result.errors.length}):
                </p>
                <ul className="space-y-1">
                  {result.errors.map((e, i) => (
                    <li key={i} className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626" }}>
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

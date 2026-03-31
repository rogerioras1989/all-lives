"use client";
import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { ConsultorTenantShell, useConsultorTenantData } from "@/components/ConsultorTenantShell";

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
  const tenantData = useConsultorTenantData(id);
  const { readOnly } = tenantData;
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
    if (!file || readOnly) return;
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
    <ConsultorTenantShell
      tenantId={id}
      company={tenantData.company}
      viewerRoleLabel={tenantData.viewerRoleLabel}
      readOnly={tenantData.readOnly}
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 fade-up">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#1e3a4a" }}>
            Importar via CSV
          </h1>
          <p className="text-sm" style={{ color: "#7a9aaa" }}>
            Cadastre múltiplos funcionários de uma vez. Os CPFs são automaticamente anonimizados.
          </p>
        </div>

        {readOnly && (
          <div className="card-3d-sm p-4 mb-6 fade-up flex items-start gap-3"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)" }}>
            <span className="text-xl">🔒</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#9a6700" }}>Importação bloqueada para analistas</p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: "#7a6a4a" }}>
                O layout do CSV permanece visível para consulta, mas apenas perfis com gestão da empresa podem subir novos colaboradores.
              </p>
            </div>
          </div>
        )}

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
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (readOnly) return;
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
        >
          <div
            className="m-1 rounded-xl border-2 border-dashed transition-all p-10 text-center cursor-pointer"
            style={{
              borderColor: readOnly ? "rgba(156,163,175,0.3)" : dragOver ? "#2e7fa3" : "rgba(91,158,201,0.3)",
              background: readOnly ? "rgba(156,163,175,0.05)" : dragOver ? "rgba(46,127,163,0.04)" : "transparent",
              cursor: readOnly ? "not-allowed" : "pointer",
            }}
            onClick={() => { if (!readOnly) fileRef.current?.click(); }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (readOnly) return;
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <div className="text-4xl mb-3">📤</div>
            {readOnly ? (
              <>
                <p className="text-sm font-semibold" style={{ color: "#5a6a75" }}>
                  Upload indisponível em modo analítico
                </p>
                <p className="text-xs mt-1" style={{ color: "#8a99a4" }}>
                  Perfis de leitura podem baixar o modelo, mas não anexar novos arquivos.
                </p>
              </>
            ) : file ? (
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
          disabled={!file || loading || readOnly}
          className="btn-primary w-full mb-8"
          style={{ opacity: !file || loading || readOnly ? 0.6 : 1 }}
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
    </ConsultorTenantShell>
  );
}

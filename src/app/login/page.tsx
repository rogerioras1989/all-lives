"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Step = "cpf" | "pin" | "totp";

function formatCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("cpf");
  const [cpf, setCpf] = useState("");
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [totp, setTotp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const totpRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleCpfSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) { setError("CPF inválido"); return; }
    setError("");
    setStep("pin");
    setTimeout(() => pinRefs.current[0]?.focus(), 100);
  }

  function handlePinChange(idx: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...pin];
    next[idx] = val;
    setPin(next);
    if (val && idx < 5) pinRefs.current[idx + 1]?.focus();
  }

  function handlePinKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[idx] && idx > 0) {
      pinRefs.current[idx - 1]?.focus();
    }
  }

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pinStr = pin.join("");
    if (pinStr.length !== 6) { setError("PIN incompleto"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: cpf.replace(/\D/g, ""), pin: pinStr }),
      });
      const data = await res.json();
      if (data.requireTotp) {
        setStep("totp");
        setTimeout(() => totpRefs.current[0]?.focus(), 100);
      } else if (data.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Erro ao entrar");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleTotpChange(idx: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...totp];
    next[idx] = val;
    setTotp(next);
    if (val && idx < 5) totpRefs.current[idx + 1]?.focus();
  }

  function handleTotpKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !totp[idx] && idx > 0) {
      totpRefs.current[idx - 1]?.focus();
    }
  }

  async function handleTotpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const totpStr = totp.join("");
    if (totpStr.length !== 6) { setError("Código incompleto"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: cpf.replace(/\D/g, ""), pin: pin.join(""), totpToken: totpStr }),
      });
      const data = await res.json();
      if (data.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Código inválido");
      }
    } finally {
      setLoading(false);
    }
  }

  const stepLabel = { cpf: "1 de 3", pin: "2 de 3", totp: "3 de 3" }[step];
  const stepPct = { cpf: 33, pin: 66, totp: 100 }[step];

  return (
    <main className="min-h-screen gradient-hero flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="https://all-livesocupacional.com.br/wp-content/uploads/2025/01/AllLivesPreferencial-copiar.png.webp"
            alt="All Lives"
            width={140}
            height={44}
            className="object-contain"
            unoptimized
          />
        </div>

        <div className="card-3d p-8 fade-up">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-2" style={{ color: "#7a9aaa" }}>
              <span>Autenticação</span>
              <span>{stepLabel}</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: "rgba(91,158,201,0.15)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${stepPct}%`,
                  background: "linear-gradient(90deg, #2e7fa3, #5baa6d)",
                }}
              />
            </div>
          </div>

          {/* CPF Step */}
          {step === "cpf" && (
            <form onSubmit={handleCpfSubmit} className="slide-in-right">
              <h2 className="text-xl font-bold mb-1" style={{ color: "#1e3a4a" }}>
                Informe seu CPF
              </h2>
              <p className="text-xs mb-6" style={{ color: "#7a9aaa" }}>
                Seu CPF é anonimizado — apenas um hash é armazenado
              </p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all mb-4"
                style={{
                  borderColor: "rgba(91,158,201,0.3)",
                  background: "#f8fbfd",
                  color: "#1e3a4a",
                }}
                autoFocus
              />
              {error && <p className="text-xs mb-3" style={{ color: "#dc2626" }}>{error}</p>}
              <button type="submit" className="btn-primary w-full">Continuar</button>
            </form>
          )}

          {/* PIN Step */}
          {step === "pin" && (
            <form onSubmit={handlePinSubmit} className="slide-in-right">
              <h2 className="text-xl font-bold mb-1" style={{ color: "#1e3a4a" }}>
                Digite seu PIN
              </h2>
              <p className="text-xs mb-6" style={{ color: "#7a9aaa" }}>
                PIN de 6 dígitos cadastrado previamente
              </p>
              <div className="flex gap-2 justify-center mb-6">
                {pin.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { pinRefs.current[i] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handlePinChange(i, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(i, e)}
                    className="w-11 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all"
                    style={{
                      borderColor: d ? "#2e7fa3" : "rgba(91,158,201,0.25)",
                      background: d ? "rgba(46,127,163,0.06)" : "#f8fbfd",
                      color: "#1e3a4a",
                    }}
                  />
                ))}
              </div>
              {error && <p className="text-xs mb-3 text-center" style={{ color: "#dc2626" }}>{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? "Verificando…" : "Entrar"}
              </button>
              <button
                type="button"
                className="w-full mt-2 text-xs py-2"
                style={{ color: "#7a9aaa" }}
                onClick={() => { setStep("cpf"); setPin(["","","","","",""]); setError(""); }}
              >
                ← Voltar
              </button>
            </form>
          )}

          {/* TOTP Step */}
          {step === "totp" && (
            <form onSubmit={handleTotpSubmit} className="slide-in-right">
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">📱</div>
                <h2 className="text-xl font-bold mb-1" style={{ color: "#1e3a4a" }}>
                  Verificação em 2 etapas
                </h2>
                <p className="text-xs" style={{ color: "#7a9aaa" }}>
                  Abra seu app autenticador e informe o código de 6 dígitos
                </p>
              </div>
              <div className="flex gap-2 justify-center mb-6 mt-6">
                {totp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { totpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleTotpChange(i, e.target.value)}
                    onKeyDown={(e) => handleTotpKeyDown(i, e)}
                    className="w-11 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all"
                    style={{
                      borderColor: d ? "#5baa6d" : "rgba(91,158,201,0.25)",
                      background: d ? "rgba(91,170,109,0.06)" : "#f8fbfd",
                      color: "#1e3a4a",
                    }}
                  />
                ))}
              </div>
              {error && <p className="text-xs mb-3 text-center" style={{ color: "#dc2626" }}>{error}</p>}
              <button type="submit" className="btn-green w-full" disabled={loading}>
                {loading ? "Verificando…" : "Verificar"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#aac0cc" }}>
          Acesso protegido · dados anonimizados · LGPD
        </p>
      </div>
    </main>
  );
}

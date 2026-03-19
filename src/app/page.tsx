"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

const LOGO = "https://all-livesocupacional.com.br/wp-content/uploads/2025/01/AllLivesPreferencial-copiar.png.webp";

// ── Animated counter ─────────────────────────────────────────────────────────
function useCountUp(target: number, isActive: boolean, duration = 1600): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isActive) return;
    let current = 0;
    const steps = 60;
    const inc = target / steps;
    const ms = duration / steps;
    const t = setInterval(() => {
      current += inc;
      if (current >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(current));
    }, ms);
    return () => clearInterval(t);
  }, [isActive, target, duration]);
  return count;
}

// ── Scroll reveal hook ────────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".sr");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("sr-in"); }),
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ── Stats ref observer ────────────────────────────────────────────────────────
function useInViewOnce(ref: React.RefObject<HTMLElement | null>) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setSeen(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return seen;
}

// ── Mock Dashboard ────────────────────────────────────────────────────────────
function MockDashboard() {
  const bars = [85, 70, 62, 55, 45, 40, 35, 30, 25];
  const barColors = ["#dc2626","#f97316","#f59e0b","#f59e0b","#5baa6d","#5baa6d","#5baa6d","#5baa6d","#5baa6d"];
  const rows = [
    { name: "Assédio Moral", score: 85, color: "#dc2626", label: "Crítico" },
    { name: "Carga de Trabalho", score: 70, color: "#f97316", label: "Alto" },
    { name: "Reconhecimento", score: 55, color: "#f59e0b", label: "Moderado" },
    { name: "Clima Org.", score: 35, color: "#5baa6d", label: "Baixo" },
  ];
  return (
    <div style={{
      width: 420, background: "#eef4f8", borderRadius: 16, overflow: "hidden",
      boxShadow: "0 40px 100px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.25)",
      transform: "perspective(1200px) rotateY(-8deg) rotateX(3deg)",
      border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0,
    }}>
      {/* Window bar */}
      <div style={{ background: "#1e3a4a", padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
        {["#ff5f57","#febc2e","#28c840"].map((c) => (
          <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
        ))}
        <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 4, height: 16, marginLeft: 8 }} />
      </div>
      {/* App header */}
      <div style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(91,158,201,0.15)", padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 58, height: 14, background: "linear-gradient(135deg,#2e7fa3,#5baa6d)", borderRadius: 3 }} />
          <div style={{ width: 48, height: 11, background: "rgba(91,170,109,0.25)", borderRadius: 8 }} />
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <div style={{ width: 38, height: 18, background: "rgba(91,158,201,0.2)", borderRadius: 6 }} />
          <div style={{ width: 38, height: 18, background: "linear-gradient(135deg,#2e7fa3,#1e5f7a)", borderRadius: 6 }} />
        </div>
      </div>
      {/* KPIs */}
      <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
        {[
          { icon: "📝", label: "Respostas", value: "247", c: "#2e7fa3" },
          { icon: "📊", label: "Score", value: "58%", c: "#f59e0b" },
          { icon: "⚠️", label: "Crítico", value: "Assédio", c: "#dc2626" },
          { icon: "🏢", label: "Setores", value: "6", c: "#5baa6d" },
        ].map((k) => (
          <div key={k.label} style={{ background: "white", borderRadius: 8, padding: "7px 8px", border: "1px solid rgba(91,158,201,0.1)" }}>
            <div style={{ fontSize: 10, marginBottom: 2 }}>{k.icon}</div>
            <div style={{ fontSize: 6.5, color: "#7a9aaa", marginBottom: 1 }}>{k.label}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: k.c }}>{k.value}</div>
          </div>
        ))}
      </div>
      {/* Charts */}
      <div style={{ padding: "0 14px 10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <div style={{ background: "white", borderRadius: 8, padding: 10, border: "1px solid rgba(91,158,201,0.1)" }}>
          <div style={{ fontSize: 7, color: "#7a9aaa", marginBottom: 6 }}>Perfil de Risco</div>
          <svg width="100%" viewBox="0 0 80 72" style={{ display: "block" }}>
            <polygon points="40,4 70,20 70,52 40,68 10,52 10,20" fill="none" stroke="rgba(91,158,201,0.2)" strokeWidth="0.8" />
            <polygon points="40,16 60,28 60,46 40,56 20,46 20,28" fill="none" stroke="rgba(91,158,201,0.15)" strokeWidth="0.8" />
            <polygon points="40,10 63,25 64,50 40,64 17,50 18,27" fill="rgba(46,127,163,0.18)" stroke="#2e7fa3" strokeWidth="1.2" />
          </svg>
        </div>
        <div style={{ background: "white", borderRadius: 8, padding: 10, border: "1px solid rgba(91,158,201,0.1)" }}>
          <div style={{ fontSize: 7, color: "#7a9aaa", marginBottom: 6 }}>Score por Tópico</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 46 }}>
            {bars.map((h, i) => (
              <div key={i} style={{ flex: 1, background: barColors[i], borderRadius: "2px 2px 0 0", height: `${h}%`, opacity: 0.85 }} />
            ))}
          </div>
        </div>
      </div>
      {/* Table */}
      <div style={{ padding: "0 14px 14px" }}>
        <div style={{ background: "white", borderRadius: 8, border: "1px solid rgba(91,158,201,0.1)", overflow: "hidden" }}>
          <div style={{ padding: "5px 10px", background: "rgba(91,158,201,0.04)", borderBottom: "1px solid rgba(91,158,201,0.08)" }}>
            <span style={{ fontSize: 7, color: "#7a9aaa" }}>Detalhamento por Tópico</span>
          </div>
          {rows.map((r, i) => (
            <div key={i} style={{ padding: "5px 10px", display: "flex", alignItems: "center", gap: 6, borderTop: i > 0 ? "1px solid rgba(91,158,201,0.06)" : undefined }}>
              <div style={{ fontSize: 7, color: "#1e3a4a", width: 76, flexShrink: 0 }}>{r.name}</div>
              <div style={{ flex: 1, height: 3, background: "rgba(91,158,201,0.12)", borderRadius: 2 }}>
                <div style={{ width: `${r.score}%`, height: "100%", background: r.color, borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 6.5, fontWeight: 700, color: r.color, width: 28, textAlign: "right", flexShrink: 0 }}>{r.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Animated stat ─────────────────────────────────────────────────────────────
function AnimatedStat({ value, suffix, label, isActive }: { value: number | string; suffix: string; label: string; isActive: boolean }) {
  const isNum = typeof value === "number";
  const count = useCountUp(isNum ? (value as number) : 0, isActive && isNum);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "clamp(2.8rem,5vw,4.2rem)", fontWeight: 900, background: "linear-gradient(135deg,#5baa6d,#2e7fa3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1, marginBottom: 12 }}>
        {isNum ? count : value}{suffix}
      </div>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>{label}</p>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const PROBLEMS = [
  { icon: "📋", title: "Auditorias Manuais", desc: "Processos baseados em planilhas e e-mails geram dados inconsistentes e deixam a empresa vulnerável a fiscalizações." },
  { icon: "🧩", title: "Risco Fragmentado", desc: "Dados espalhados em silos impedem uma visão integrada dos riscos psicossociais da organização." },
  { icon: "🔇", title: "Falta de Confiança", desc: "Sem anonimato real, colaboradores não respondem com honestidade e os dados perdem validade." },
];
const FEATURES = [
  { num: "01", icon: "🔍", title: "Diagnóstico Inteligente", desc: "Mapeamento automático de riscos psicossociais com análises por dimensão, setor e todos os riscos personalizados." },
  { num: "02", icon: "✅", title: "Conformidade Contínua", desc: "Acompanhamento em tempo real de normas regulatórias e LGPD, eliminando surpresas em auditorias." },
  { num: "03", icon: "🎯", title: "Planos de Ação Ágeis", desc: "Geração automática de planos de ação com responsáveis, prazos e trilhas de acompanhamento." },
  { num: "04", icon: "💬", title: "Engajamento Real", desc: "Anonimato garantido e experiência intuitiva que elevam a participação e a veracidade dos dados." },
];
const TESTIMONIALS = [
  { name: "Maria Fernanda S.", role: "Gerente de RH", company: "Setor Farmacêutico", text: "Implementamos o diagnóstico DRPS e em 3 meses conseguimos reduzir 40% dos afastamentos. A plataforma é simples e os dados são confiáveis.", avatar: "MF", color: "#2e7fa3" },
  { name: "Carlos Eduardo T.", role: "Diretor de Pessoas", company: "Indústria de Alimentos", text: "O relatório gerado automaticamente facilitou muito a apresentação para a diretoria. Aprovamos o plano de ação em 2 semanas.", avatar: "CE", color: "#5baa6d" },
  { name: "Ana Paula M.", role: "SESMT", company: "Construtora Regional", text: "O anonimato garantido fez toda a diferença. Nossa taxa de adesão foi de 91% na primeira campanha — algo que nunca conseguimos antes.", avatar: "AP", color: "#8b5cf6" },
];
const SECURITY = [
  { icon: "🔐", label: "Criptografia AES-256" }, { icon: "👤", label: "CPF Anonimizado" },
  { icon: "🛡️", label: "Conformidade LGPD" }, { icon: "🔒", label: "JWT + 2FA" },
  { icon: "📵", label: "Zero PII nos dados" }, { icon: "✅", label: "Auditoria NR-01" },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const statsRef = useRef<HTMLDivElement>(null);
  const statsVisible = useInViewOnce(statsRef);

  useScrollReveal();

  async function handleContact(e: React.FormEvent) {
    e.preventDefault();
    setFormStatus("sending");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setFormStatus(res.ok ? "sent" : "error");
      if (res.ok) setForm({ name: "", email: "", company: "", message: "" });
    } catch { setFormStatus("error"); }
  }

  return (
    <main style={{ background: "#0b1929", color: "white", fontFamily: "var(--font-geist-sans),Inter,system-ui,sans-serif", overflowX: "hidden" }}>
      <style>{`
        .sr { opacity:0; transform:translateY(28px); transition: opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1); }
        .sr.sr-in { opacity:1; transform:none; }
        @media(max-width:768px){ .desk-nav{display:none!important} .mock-hero{display:none!important} .contact-grid{grid-template-columns:1fr!important;gap:40px!important} }
        @media(min-width:769px){ .mob-btn{display:none!important} }
      `}</style>

      {/* ── HEADER ──────────────────────────────── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(11,25,41,0.9)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(91,158,201,0.1)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <Image src={LOGO} alt="All Lives" width={120} height={38} unoptimized style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }} />
          <nav className="desk-nav" style={{ display: "flex", gap: 28, alignItems: "center" }}>
            {[["#problemas","Problemas"],["#solucao","Solução"],["#depoimentos","Cases"],["#contato","Contato"]].map(([href, label]) => (
              <a key={href} href={href} style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>{label}</a>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/login" style={{ background: "linear-gradient(135deg,#2e7fa3,#5baa6d)", color: "white", padding: "10px 20px", borderRadius: 12, fontWeight: 700, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>
              Acessar →
            </Link>
            <button className="mob-btn" onClick={() => setMobileOpen(!mobileOpen)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              {[0,1,2].map((i) => <div key={i} style={{ width: 20, height: 2, background: "white", borderRadius: 1 }} />)}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div style={{ background: "rgba(11,25,41,0.97)", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
            {[["#problemas","Problemas"],["#solucao","Solução"],["#depoimentos","Cases"],["#contato","Contato"]].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileOpen(false)}
                style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, fontWeight: 500, textDecoration: "none" }}>{label}</a>
            ))}
          </div>
        )}
      </header>

      {/* ── HERO ──────────────────────────────── */}
      <section style={{ minHeight: "92vh", display: "flex", alignItems: "center", padding: "80px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "35%", left: "15%", width: 700, height: 500, background: "radial-gradient(ellipse,rgba(46,127,163,0.2) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: 64, justifyContent: "space-between" }}>
          <div style={{ maxWidth: 580, position: "relative", zIndex: 1 }} className="fade-up">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(91,170,109,0.12)", border: "1px solid rgba(91,170,109,0.25)", borderRadius: 99, padding: "6px 18px", fontSize: 12, fontWeight: 600, color: "#5baa6d", marginBottom: 28, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5baa6d", display: "inline-block" }} />
              Diagnóstico Psicossocial · NR-01
            </div>
            <h1 style={{ fontSize: "clamp(2.4rem,5vw,4.2rem)", fontWeight: 800, lineHeight: 1.12, marginBottom: 24 }}>
              Quando as pessoas{" "}<br />
              estão bem,{" "}
              <span style={{ background: "linear-gradient(135deg,#5baa6d,#2e7fa3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                o trabalho flui melhor
              </span>.
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", maxWidth: 500, marginBottom: 40, lineHeight: 1.75 }}>
              Transforme o cuidado com a saúde mental em resultados mensuráveis. Consultoria, dados e acolhimento em plataforma única.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" as const }}>
              <Link href="/login" style={{ background: "linear-gradient(135deg,#2e7fa3,#1e5f7a)", color: "white", padding: "14px 32px", borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: "none", boxShadow: "0 6px 28px rgba(46,127,163,0.45)" }}>
                Acessar a Plataforma
              </Link>
              <a href="#solucao" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.8)", padding: "14px 32px", borderRadius: 14, fontWeight: 600, fontSize: 15, textDecoration: "none" }}>
                Conheça a Solução ↓
              </a>
            </div>
          </div>
          <div className="mock-hero"><MockDashboard /></div>
        </div>
      </section>

      {/* ── O QUE SOMOS ──────────────────────────────── */}
      <section style={{ padding: "72px 24px", background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="sr" style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.2rem)", fontWeight: 800, marginBottom: 20 }}>
            All Lives: <span style={{ background: "linear-gradient(135deg,#5baa6d,#2e7fa3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>o que somos, afinal?</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 17, lineHeight: 1.8, maxWidth: 640, margin: "0 auto" }}>
            Um ecossistema de orientação e governança humana, focado em resultados, que ajuda organizações a dar direção, estrutura e segurança à gestão da saúde mental, de forma estratégica e contínua.
          </p>
        </div>
      </section>

      {/* ── PROBLEMS ──────────────────────────────── */}
      <section id="problemas" style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: "#2e7fa3", textTransform: "uppercase", textAlign: "center", marginBottom: 14 }}>O Problema</p>
          <h2 className="sr" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, textAlign: "center", marginBottom: 56, maxWidth: 680, margin: "0 auto 56px" }}>
            Por que a maioria das empresas ainda está vulnerável?
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24 }}>
            {PROBLEMS.map((p, i) => (
              <div key={i} className="sr" style={{ transitionDelay: `${i * 120}ms`, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(91,158,201,0.14)", borderRadius: 20, padding: 32 }}>
                <div style={{ fontSize: 36, marginBottom: 18 }}>{p.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "white" }}>{p.title}</h3>
                <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.75, fontSize: 14, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION ──────────────────────────────── */}
      <section id="solucao" style={{ padding: "96px 24px", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: "#5baa6d", textTransform: "uppercase", textAlign: "center", marginBottom: 14 }}>Nossa Solução</p>
          <h2 className="sr" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, textAlign: "center", marginBottom: 64 }}>
            Transforme NR-01 em oportunidade
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 24 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="sr" style={{ transitionDelay: `${i * 100}ms`, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(91,158,201,0.12)", borderRadius: 20, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#2e7fa3", background: "rgba(46,127,163,0.15)", borderRadius: 7, padding: "4px 8px" }}>{f.num}</span>
                  <span style={{ fontSize: 22 }}>{f.icon}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: "white" }}>{f.title}</h3>
                <p style={{ color: "rgba(255,255,255,0.48)", lineHeight: 1.75, fontSize: 13, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────── */}
      <section ref={statsRef} style={{ padding: "96px 24px", background: "linear-gradient(135deg,rgba(46,127,163,0.1),rgba(91,170,109,0.07))", borderTop: "1px solid rgba(91,158,201,0.1)", borderBottom: "1px solid rgba(91,158,201,0.1)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: "#2e7fa3", textTransform: "uppercase", textAlign: "center", marginBottom: 14 }}>Plataforma</p>
          <h2 className="sr" style={{ fontSize: "clamp(1.6rem,3.5vw,2.5rem)", fontWeight: 800, textAlign: "center", marginBottom: 64 }}>
            Transformamos dados em decisões estratégicas
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 40 }}>
            <AnimatedStat value={90}  suffix=""  label="Questões psicossociais" isActive={statsVisible} />
            <AnimatedStat value={9}   suffix=""  label="Dimensões avaliadas"    isActive={statsVisible} />
            <AnimatedStat value={100} suffix="%" label="Conformidade com NR-01" isActive={statsVisible} />
            <AnimatedStat value="LGPD" suffix="" label="Compliant"              isActive={statsVisible} />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────── */}
      <section id="depoimentos" style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: "#5baa6d", textTransform: "uppercase", textAlign: "center", marginBottom: 14 }}>Cases</p>
          <h2 className="sr" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, textAlign: "center", marginBottom: 56 }}>
            Empresas que transformaram<br />sua gestão
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="sr" style={{ transitionDelay: `${i * 120}ms`, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(91,158,201,0.14)", borderRadius: 20, padding: 32 }}>
                <div style={{ fontSize: 32, marginBottom: 16, color: "rgba(255,255,255,0.15)" }}>&quot;</div>
                <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.75, fontSize: 15, marginBottom: 24, fontStyle: "italic" }}>{t.text}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "white", background: t.color, flexShrink: 0 }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{t.role} · {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY ──────────────────────────────── */}
      <section id="seguranca" style={{ padding: "96px 24px", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: "#5baa6d", textTransform: "uppercase", marginBottom: 14 }}>Segurança e LGPD</p>
          <h2 className="sr" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, marginBottom: 56 }}>
            Sua Confiança é Nossa Prioridade
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 20 }}>
            {SECURITY.map((s, i) => (
              <div key={i} className="sr" style={{ transitionDelay: `${i * 80}ms`, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(91,158,201,0.14)", borderRadius: 16, padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────── */}
      <section id="contato" style={{ padding: "96px 24px", background: "linear-gradient(135deg,rgba(46,127,163,0.1),rgba(91,170,109,0.07))", borderTop: "1px solid rgba(91,158,201,0.1)" }}>
        <div className="contact-grid" style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>
          <div className="sr">
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: "#5baa6d", textTransform: "uppercase", marginBottom: 14 }}>Contato</p>
            <h2 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, marginBottom: 20, lineHeight: 1.2 }}>Vamos Conversar?</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, lineHeight: 1.75, marginBottom: 32 }}>
              Agende uma demonstração gratuita e descubra como a All Lives pode transformar a saúde mental na sua empresa em resultados mensuráveis.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(46,127,163,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>📧</div>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>contato@all-livesocupacional.com.br</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(91,170,109,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>🌐</div>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>all-livesocupacional.com.br</span>
              </div>
            </div>
          </div>

          <div className="sr" style={{ transitionDelay: "150ms" }}>
            {formStatus === "sent" ? (
              <div style={{ background: "rgba(91,170,109,0.1)", border: "1px solid rgba(91,170,109,0.3)", borderRadius: 20, padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Mensagem enviada!</h3>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>Entraremos em contato em breve.</p>
                <button onClick={() => setFormStatus("idle")} style={{ marginTop: 20, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "white", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontSize: 14 }}>
                  Enviar outra mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleContact} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(91,158,201,0.15)", borderRadius: 20, padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { key: "name", label: "Nome", placeholder: "Seu nome", type: "text", required: true },
                  { key: "email", label: "Email", placeholder: "seu@email.com", type: "email", required: true },
                  { key: "company", label: "Empresa", placeholder: "Nome da empresa", type: "text", required: false },
                ].map((f) => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} required={f.required}
                      value={form[f.key as keyof typeof form]}
                      onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(91,158,201,0.2)", borderRadius: 10, padding: "10px 14px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" as const }} />
                  </div>
                ))}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Mensagem (opcional)</label>
                  <textarea rows={3} placeholder="Conte-nos sobre sua empresa..."
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(91,158,201,0.2)", borderRadius: 10, padding: "10px 14px", color: "white", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" as const }} />
                </div>
                {formStatus === "error" && <p style={{ color: "#f87171", fontSize: 13 }}>Erro ao enviar. Tente novamente.</p>}
                <button type="submit" disabled={formStatus === "sending"} style={{ background: "linear-gradient(135deg,#5baa6d,#3d8a50)", color: "white", border: "none", padding: "14px 0", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: formStatus === "sending" ? "wait" : "pointer", boxShadow: "0 4px 20px rgba(91,170,109,0.3)" }}>
                  {formStatus === "sending" ? "Enviando..." : "Enviar mensagem →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "40px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <Image src={LOGO} alt="All Lives" width={100} height={32} unoptimized style={{ objectFit: "contain", filter: "brightness(0) invert(1) opacity(0.6)" }} />
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
            <Link href="/login" style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none" }}>Acessar</Link>
            <Link href="/blog" style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none" }}>Blog</Link>
            <Link href="/consultor/login" style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none" }}>Portal Consultor</Link>
          </div>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, margin: 0 }}>© 2025 All Lives Gestão Ocupacional. Todos os direitos reservados.</p>
        </div>
      </footer>
    </main>
  );
}

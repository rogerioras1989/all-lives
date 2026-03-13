import Link from "next/link";
import Image from "next/image";

const LOGO = "https://all-livesocupacional.com.br/wp-content/uploads/2025/01/AllLivesPreferencial-copiar.png.webp";

const problems = [
  {
    icon: "📋",
    title: "Auditorias Manuais",
    desc: "Processos baseados em planilhas e e-mails geram dados inconsistentes e deixam a empresa vulnerável a fiscalizações.",
  },
  {
    icon: "🧩",
    title: "Risco Fragmentado",
    desc: "Dados espalhados em silos impedem uma visão integrada dos riscos psicossociais da organização.",
  },
  {
    icon: "🔇",
    title: "Falta de Confiança",
    desc: "Sem anonimato real, colaboradores não respondem com honestidade e os dados perdem validade.",
  },
];

const features = [
  {
    num: "01",
    icon: "🔍",
    title: "Diagnóstico Inteligente",
    desc: "Mapeamento automático de riscos psicossociais com análises por dimensão, setor e todos os riscos personalizados.",
  },
  {
    num: "02",
    icon: "✅",
    title: "Conformidade Contínua",
    desc: "Acompanhamento em tempo real de normas regulatórias e LGPD, eliminando surpresas em auditorias.",
  },
  {
    num: "03",
    icon: "🎯",
    title: "Planos de Ação Ágeis",
    desc: "Geração automática de planos de ação com responsáveis, prazos e trilhas de acompanhamento.",
  },
  {
    num: "04",
    icon: "💬",
    title: "Engajamento Real",
    desc: "Anonimato garantido e experiência intuitiva que elevam a participação e a veracidade dos dados.",
  },
];

const stats = [
  { value: "90", suffix: "", label: "Questões psicossociais" },
  { value: "9", suffix: "", label: "Dimensões avaliadas" },
  { value: "100", suffix: "%", label: "Conformidade com NR-01" },
  { value: "LGPD", suffix: "", label: "Compliant" },
];

const security = [
  { icon: "🔐", label: "Criptografia AES-256" },
  { icon: "👤", label: "CPF Anonimizado" },
  { icon: "🛡️", label: "Conformidade LGPD" },
  { icon: "🔒", label: "JWT + 2FA" },
  { icon: "📵", label: "Zero PII nos dados" },
  { icon: "✅", label: "Auditoria NR-01" },
];

export default function LandingPage() {
  return (
    <main style={{ background: "#0b1929", color: "white", fontFamily: "var(--font-geist-sans), Inter, system-ui, sans-serif", overflowX: "hidden" }}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,25,41,0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(91,158,201,0.1)",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", height: 64,
        }}>
          <Image src={LOGO} alt="All Lives" width={120} height={38} unoptimized
            style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }} />

          <nav style={{ gap: 32, alignItems: "center", display: "flex" }}>
            {[
              { href: "#problemas", label: "Problemas" },
              { href: "#solucao", label: "Solução" },
              { href: "#seguranca", label: "Segurança" },
            ].map((item) => (
              <a key={item.href} href={item.href} style={{
                color: "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: 500,
                textDecoration: "none", transition: "color 0.2s",
              }}>
                {item.label}
              </a>
            ))}
          </nav>

          <Link href="/login" style={{
            background: "linear-gradient(135deg, #2e7fa3 0%, #5baa6d 100%)",
            color: "white", padding: "10px 22px", borderRadius: 12,
            fontWeight: 700, fontSize: 14, textDecoration: "none",
            boxShadow: "0 4px 16px rgba(46,127,163,0.35)",
            whiteSpace: "nowrap",
          }}>
            Acessar Plataforma →
          </Link>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "92vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "80px 24px",
        position: "relative", overflow: "hidden",
      }}>
        {/* background glow */}
        <div style={{
          position: "absolute", top: "30%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 900, height: 600,
          background: "radial-gradient(ellipse at center, rgba(46,127,163,0.18) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "10%",
          width: 400, height: 400,
          background: "radial-gradient(ellipse at center, rgba(91,170,109,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="fade-up" style={{ position: "relative", zIndex: 1, maxWidth: 820 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(91,170,109,0.12)", border: "1px solid rgba(91,170,109,0.25)",
            borderRadius: 99, padding: "6px 18px",
            fontSize: 12, fontWeight: 600, color: "#5baa6d",
            marginBottom: 32, letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5baa6d", display: "inline-block" }} />
            Diagnóstico de Riscos Psicossociais · NR-01
          </div>

          <h1 style={{
            fontSize: "clamp(2.6rem, 6vw, 4.8rem)",
            fontWeight: 800, lineHeight: 1.12, marginBottom: 28,
          }}>
            Quando as pessoas{" "}
            <br className="hidden sm:block" />
            estão bem,{" "}
            <span style={{
              background: "linear-gradient(135deg, #5baa6d, #2e7fa3)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              o trabalho flui melhor
            </span>
            .
          </h1>

          <p style={{
            fontSize: "clamp(15px, 2vw, 18px)",
            color: "rgba(255,255,255,0.55)", maxWidth: 580,
            margin: "0 auto 44px", lineHeight: 1.75,
          }}>
            Transforme o cuidado com a saúde mental em resultados mensuráveis para sua empresa.
            Consultoria, dados e acolhimento em plataforma única.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" style={{
              background: "linear-gradient(135deg, #2e7fa3 0%, #1e5f7a 100%)",
              color: "white", padding: "14px 36px", borderRadius: 14,
              fontWeight: 700, fontSize: 15, textDecoration: "none",
              boxShadow: "0 6px 28px rgba(46,127,163,0.45)",
            }}>
              Acessar a Plataforma
            </Link>
            <a href="#problemas" style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "rgba(255,255,255,0.8)", padding: "14px 36px", borderRadius: 14,
              fontWeight: 600, fontSize: 15, textDecoration: "none",
            }}>
              Conheça a Solução ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── "O QUE SOMOS" ──────────────────────────────────────────────── */}
      <section style={{ padding: "72px 24px", background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 800, marginBottom: 20 }}>
            All Lives:{" "}
            <span style={{
              background: "linear-gradient(135deg, #5baa6d, #2e7fa3)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              o que somos, afinal?
            </span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 17, lineHeight: 1.8, maxWidth: 640, margin: "0 auto" }}>
            Um ecossistema de orientação e governança humana, focado em resultados,
            que ajuda organizações a dar direção, estrutura e segurança à gestão da
            saúde mental, de forma estratégica e contínua.
          </p>
        </div>
      </section>

      {/* ── PROBLEMS ───────────────────────────────────────────────────── */}
      <section id="problemas" style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.16em",
            color: "#2e7fa3", textTransform: "uppercase",
            textAlign: "center", marginBottom: 14,
          }}>
            O Problema
          </p>
          <h2 style={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800,
            textAlign: "center", marginBottom: 56, maxWidth: 680, margin: "0 auto 56px",
          }}>
            Por que a maioria das empresas ainda está vulnerável?
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}>
            {problems.map((p, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(91,158,201,0.14)",
                borderRadius: 20, padding: 32,
                transition: "border-color 0.2s",
              }}>
                <div style={{ fontSize: 36, marginBottom: 18 }}>{p.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "white" }}>{p.title}</h3>
                <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.75, fontSize: 14, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION ───────────────────────────────────────────────────── */}
      <section id="solucao" style={{ padding: "96px 24px", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.16em",
            color: "#5baa6d", textTransform: "uppercase",
            textAlign: "center", marginBottom: 14,
          }}>
            Nossa Solução
          </p>
          <h2 style={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800,
            textAlign: "center", marginBottom: 64,
          }}>
            Transforme NR-01 em oportunidade
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 24,
          }}>
            {features.map((f, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(91,158,201,0.12)",
                borderRadius: 20, padding: 28,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: "#2e7fa3",
                    background: "rgba(46,127,163,0.15)", borderRadius: 7,
                    padding: "4px 8px", letterSpacing: "0.05em",
                  }}>
                    {f.num}
                  </span>
                  <span style={{ fontSize: 22 }}>{f.icon}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: "white" }}>{f.title}</h3>
                <p style={{ color: "rgba(255,255,255,0.48)", lineHeight: 1.75, fontSize: 13, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────────── */}
      <section style={{
        padding: "96px 24px",
        background: "linear-gradient(135deg, rgba(46,127,163,0.1) 0%, rgba(91,170,109,0.07) 100%)",
        borderTop: "1px solid rgba(91,158,201,0.1)",
        borderBottom: "1px solid rgba(91,158,201,0.1)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.16em",
            color: "#2e7fa3", textTransform: "uppercase",
            textAlign: "center", marginBottom: 14,
          }}>
            Plataforma
          </p>
          <h2 style={{
            fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)", fontWeight: 800,
            textAlign: "center", marginBottom: 64,
          }}>
            Transformamos dados em decisões estratégicas
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 40, textAlign: "center",
          }}>
            {stats.map((s, i) => (
              <div key={i}>
                <div style={{
                  fontSize: "clamp(2.8rem, 5vw, 4.2rem)", fontWeight: 900,
                  background: "linear-gradient(135deg, #5baa6d, #2e7fa3)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  lineHeight: 1, marginBottom: 14,
                }}>
                  {s.value}{s.suffix}
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY ───────────────────────────────────────────────────── */}
      <section id="seguranca" style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.16em",
            color: "#5baa6d", textTransform: "uppercase", marginBottom: 14,
          }}>
            Segurança e LGPD
          </p>
          <h2 style={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, marginBottom: 20,
          }}>
            Sua Confiança é Nossa Prioridade
          </h2>
          <p style={{
            color: "rgba(255,255,255,0.5)", fontSize: 16,
            maxWidth: 560, margin: "0 auto 56px", lineHeight: 1.75,
          }}>
            Plataforma construída com as melhores práticas de segurança e em total
            conformidade com a LGPD.
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 20,
          }}>
            {security.map((item, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(91,158,201,0.14)",
                borderRadius: 16, padding: "24px 16px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
      <section style={{
        padding: "96px 24px", textAlign: "center",
        background: "linear-gradient(135deg, rgba(46,127,163,0.1) 0%, rgba(91,170,109,0.08) 100%)",
        borderTop: "1px solid rgba(91,158,201,0.1)",
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 800,
            marginBottom: 20, lineHeight: 1.2,
          }}>
            Pronto para transformar<br />o bem-estar da sua equipe?
          </h2>
          <p style={{
            color: "rgba(255,255,255,0.5)", fontSize: 16, marginBottom: 44, lineHeight: 1.75,
          }}>
            Acesse a plataforma e comece agora o diagnóstico de riscos psicossociais da sua empresa.
          </p>
          <Link href="/login" style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #5baa6d 0%, #3d8a50 100%)",
            color: "white", padding: "16px 52px", borderRadius: 16,
            fontWeight: 700, fontSize: 16, textDecoration: "none",
            boxShadow: "0 8px 32px rgba(91,170,109,0.35)",
          }}>
            Acessar a Plataforma →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "40px 24px",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 24,
        }}>
          <Image src={LOGO} alt="All Lives" width={100} height={32} unoptimized
            style={{ objectFit: "contain", filter: "brightness(0) invert(1) opacity(0.6)" }} />

          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            <Link href="/login" style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none" }}>
              Acessar
            </Link>
            <Link href="/consultor/login" style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none" }}>
              Portal Consultor
            </Link>
          </div>

          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, margin: 0 }}>
            © 2025 All Lives Gestão Ocupacional. Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </main>
  );
}

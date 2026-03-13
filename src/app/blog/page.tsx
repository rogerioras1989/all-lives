import Link from "next/link";
import Image from "next/image";

const LOGO = "https://all-livesocupacional.com.br/wp-content/uploads/2025/01/AllLivesPreferencial-copiar.png.webp";

const ARTICLES = [
  {
    slug: "o-que-e-nr-01",
    tag: "NR-01",
    tagColor: "#2e7fa3",
    title: "O que é NR-01 e como ela impacta sua empresa",
    excerpt: "A NR-01 foi atualizada em 2024 e passou a exigir que as empresas incluam o gerenciamento de riscos psicossociais no PGRO. Entenda o que muda e como se adequar.",
    readTime: "5 min",
    date: "Jan 2025",
    icon: "📋",
  },
  {
    slug: "como-implementar-drps",
    tag: "Diagnóstico",
    tagColor: "#5baa6d",
    title: "Como implementar o diagnóstico DRPS na sua empresa",
    excerpt: "Um guia passo a passo para estruturar uma campanha de diagnóstico de riscos psicossociais, desde a criação até a análise dos resultados e plano de ação.",
    readTime: "8 min",
    date: "Fev 2025",
    icon: "🔍",
  },
  {
    slug: "saude-mental-dados",
    tag: "Dados",
    tagColor: "#f59e0b",
    title: "Saúde mental no trabalho: dados e tendências 2025",
    excerpt: "78% dos afastamentos estão ligados a fatores psicossociais. Conheça os números que estão transformando a forma como as empresas encaram o bem-estar corporativo.",
    readTime: "6 min",
    date: "Mar 2025",
    icon: "📊",
  },
  {
    slug: "lgpd-dados-psicossociais",
    tag: "LGPD",
    tagColor: "#8b5cf6",
    title: "LGPD e dados psicossociais: o que você precisa saber",
    excerpt: "Coletar dados sobre saúde mental dos colaboradores exige cuidado especial com a LGPD. Saiba quais bases legais usar, como anonimizar e proteger as informações.",
    readTime: "7 min",
    date: "Mar 2025",
    icon: "🔒",
  },
  {
    slug: "anonimato-engajamento",
    tag: "Engajamento",
    tagColor: "#5baa6d",
    title: "Por que o anonimato aumenta em 3x o engajamento nas pesquisas",
    excerpt: "Pesquisas mostram que colaboradores respondem com mais honestidade quando têm garantia real de anonimato. Veja como estruturar isso na prática.",
    readTime: "4 min",
    date: "Abr 2025",
    icon: "💬",
  },
  {
    slug: "planos-de-acao-nr01",
    tag: "Ação",
    tagColor: "#f97316",
    title: "Como criar planos de ação efetivos pós-diagnóstico NR-01",
    excerpt: "Receber os dados do diagnóstico é só o começo. Saiba como transformar os resultados em planos de ação SMART com responsáveis, prazos e indicadores de acompanhamento.",
    readTime: "6 min",
    date: "Abr 2025",
    icon: "🎯",
  },
];

export default function BlogPage() {
  return (
    <main style={{ background: "#0b1929", color: "white", minHeight: "100vh", fontFamily: "var(--font-geist-sans), Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,25,41,0.9)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(91,158,201,0.1)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <Image src={LOGO} alt="All Lives" width={110} height={34} unoptimized
              style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }} />
          </Link>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textDecoration: "none" }}>← Home</Link>
            <Link href="/login" style={{
              background: "linear-gradient(135deg,#2e7fa3,#5baa6d)", color: "white",
              padding: "8px 18px", borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: "none",
            }}>Acessar →</Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px 96px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(46,127,163,0.12)", border: "1px solid rgba(46,127,163,0.25)",
            borderRadius: 99, padding: "6px 16px", fontSize: 12, fontWeight: 600,
            color: "#5baa6d", marginBottom: 24, letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5baa6d", display: "inline-block" }} />
            Blog · NR-01 e Saúde Mental
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, marginBottom: 16, lineHeight: 1.15 }}>
            Conteúdo para{" "}
            <span style={{ background: "linear-gradient(135deg,#5baa6d,#2e7fa3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              transformar sua gestão
            </span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 17, maxWidth: 560, margin: "0 auto", lineHeight: 1.75 }}>
            Artigos sobre NR-01, diagnóstico psicossocial, LGPD e bem-estar corporativo para líderes de RH e SESMT.
          </p>
        </div>

        {/* Articles grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
          {ARTICLES.map((a) => (
            <article key={a.slug} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(91,158,201,0.14)",
              borderRadius: 20, padding: 28, display: "flex", flexDirection: "column", gap: 16,
              transition: "border-color 0.2s, transform 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: a.tagColor,
                  background: `${a.tagColor}18`, borderRadius: 6, padding: "3px 10px",
                  letterSpacing: "0.05em",
                }}>
                  {a.tag}
                </span>
                <span style={{ fontSize: 28 }}>{a.icon}</span>
              </div>

              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 10, lineHeight: 1.3 }}>
                  {a.title}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                  {a.excerpt}
                </p>
              </div>

              <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                  <span>{a.date}</span>
                  <span>·</span>
                  <span>{a.readTime} de leitura</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#5baa6d" }}>
                  Em breve →
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 80, padding: "56px 24px", background: "rgba(255,255,255,0.02)", borderRadius: 24, border: "1px solid rgba(91,158,201,0.1)" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 800, marginBottom: 16 }}>
            Pronto para agir?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, marginBottom: 32 }}>
            Acesse a plataforma e inicie hoje o diagnóstico de riscos psicossociais.
          </p>
          <Link href="/login" style={{
            display: "inline-block",
            background: "linear-gradient(135deg,#2e7fa3,#1e5f7a)", color: "white",
            padding: "14px 40px", borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: "none",
            boxShadow: "0 6px 24px rgba(46,127,163,0.4)",
          }}>
            Acessar a Plataforma →
          </Link>
        </div>
      </div>
    </main>
  );
}

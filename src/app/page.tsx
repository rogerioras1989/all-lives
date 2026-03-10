import Link from "next/link";
import Image from "next/image";

const topics = [
  { icon: "🛡️", label: "Assédio",           color: "rgba(220,38,38,0.08)",   border: "rgba(220,38,38,0.2)" },
  { icon: "⚡",  label: "Carga de Trabalho", color: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)" },
  { icon: "🏆",  label: "Reconhecimento",    color: "rgba(91,170,109,0.1)",   border: "rgba(91,170,109,0.25)" },
  { icon: "🌤️", label: "Clima Org.",         color: "rgba(91,158,201,0.1)",   border: "rgba(91,158,201,0.25)" },
  { icon: "🎯",  label: "Autonomia",          color: "rgba(46,127,163,0.1)",   border: "rgba(46,127,163,0.25)" },
  { icon: "📊",  label: "Pressão e Metas",   color: "rgba(234,88,12,0.08)",   border: "rgba(234,88,12,0.2)" },
  { icon: "🔒",  label: "Insegurança",        color: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)" },
  { icon: "💬",  label: "Comunicação",        color: "rgba(91,158,201,0.12)",  border: "rgba(91,158,201,0.3)" },
  { icon: "⚖️",  label: "Equilíbrio",         color: "rgba(91,170,109,0.12)",  border: "rgba(91,170,109,0.3)" },
];

export default function Home() {
  return (
    <main className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md border-b border-white/60 sticky top-0 z-20"
        style={{ boxShadow: "0 1px 12px rgba(30,95,122,0.08)" }}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Image
            src="https://all-livesocupacional.com.br/wp-content/uploads/2025/01/AllLivesPreferencial-copiar.png.webp"
            alt="All Lives"
            width={130}
            height={40}
            className="object-contain"
            unoptimized
          />
          <span className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "#2e7fa3" }}>
            NR-01
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-14 pb-20">

        {/* Hero */}
        <div className="text-center mb-14 fade-up">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-6 border"
            style={{ background: "rgba(91,158,201,0.1)", color: "#1e5f7a", borderColor: "rgba(91,158,201,0.25)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#5baa6d" }} />
            Diagnóstico de Riscos Psicossociais
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold mb-4 leading-tight" style={{ color: "#1e3a4a" }}>
            Avaliação{" "}
            <span style={{
              background: "linear-gradient(135deg,#2e7fa3,#5baa6d)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>DRPS</span>
          </h1>

          <p className="text-base max-w-lg mx-auto mb-10 leading-relaxed" style={{ color: "#5a7a8a" }}>
            Questionário confidencial para mapeamento de riscos psicossociais,
            em conformidade com a <strong style={{ color: "#2e7fa3" }}>NR-01</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/questionario" className="btn-primary inline-flex items-center justify-center gap-2 no-underline">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Responder Questionário
            </Link>
            <Link href="/dashboard" className="btn-ghost inline-flex items-center justify-center gap-2 no-underline">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard RH
            </Link>
            <Link href="/consultor/login" className="btn-ghost inline-flex items-center justify-center gap-2 no-underline text-xs">
              🏢 Painel Consultor
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="card-3d grid grid-cols-3 divide-x mb-10 fade-up"
          style={{ animationDelay: "100ms" }}>
          {[
            { icon: "🗂️", value: "9",    label: "Tópicos" },
            { icon: "❓", value: "90",   label: "Questões" },
            { icon: "⏱️", value: "~15min", label: "Duração" },
          ].map((s) => (
            <div key={s.label} className="py-7 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold" style={{ color: "#1e5f7a" }}>{s.value}</div>
              <div className="text-xs font-medium mt-0.5" style={{ color: "#7a9aaa" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Topics grid */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#7a9aaa" }}>
            Tópicos avaliados
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 stagger">
            {topics.map((t) => (
              <div
                key={t.label}
                className="fade-up rounded-2xl p-3 text-center cursor-default transition-all hover:-translate-y-1"
                style={{
                  background: t.color,
                  border: `1.5px solid ${t.border}`,
                  boxShadow: `0 4px 16px ${t.border}`,
                }}
              >
                <div className="text-2xl mb-1.5">{t.icon}</div>
                <div className="text-[10px] font-semibold leading-tight" style={{ color: "#3a5a6a" }}>
                  {t.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs mt-12" style={{ color: "#aac0cc" }}>
          Respostas confidenciais e anônimas · conforme LGPD
        </p>
      </div>
    </main>
  );
}

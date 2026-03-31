"use client";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen gradient-hero flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full fade-up">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Image
            src="https://all-livesocupacional.com.br/wp-content/uploads/2025/01/AllLivesPreferencial-copiar.png.webp"
            alt="All Lives"
            width={160}
            height={50}
            className="object-contain"
            unoptimized
          />
        </div>

        <div className="card-3d p-8 mb-4">
          <h1 className="text-xl font-bold mb-1 text-center" style={{ color: "#1e3a4a" }}>
            Como deseja acessar?
          </h1>
          <p className="text-sm text-center mb-8" style={{ color: "#7a9aaa" }}>
            Selecione o seu perfil para continuar
          </p>

          <div className="space-y-3">
            {/* Sou Colaborador */}
            <Link href="/acesso/colaborador"
              className="flex items-center gap-4 w-full p-4 rounded-2xl transition-all group"
              style={{
                border: "1.5px solid rgba(91,158,201,0.25)",
                background: "rgba(91,158,201,0.04)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.border = "1.5px solid #2e7fa3";
                (e.currentTarget as HTMLElement).style.background = "rgba(46,127,163,0.08)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(46,127,163,0.12)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.border = "1.5px solid rgba(91,158,201,0.25)";
                (e.currentTarget as HTMLElement).style.background = "rgba(91,158,201,0.04)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#2e7fa3,#1e5f7a)" }}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-sm" style={{ color: "#1e3a4a" }}>Sou Colaborador</div>
                <div className="text-xs mt-0.5" style={{ color: "#7a9aaa" }}>Responder pesquisa da minha empresa</div>
              </div>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" style={{ color: "#5b9ec9" }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Sou Empresa */}
            <Link href="/acesso/empresa"
              className="flex items-center gap-4 w-full p-4 rounded-2xl transition-all group"
              style={{
                border: "1.5px solid rgba(91,170,109,0.25)",
                background: "rgba(91,170,109,0.04)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.border = "1.5px solid #5baa6d";
                (e.currentTarget as HTMLElement).style.background = "rgba(91,170,109,0.08)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(91,170,109,0.12)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.border = "1.5px solid rgba(91,170,109,0.25)";
                (e.currentTarget as HTMLElement).style.background = "rgba(91,170,109,0.04)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#5baa6d,#3d8a50)" }}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-sm" style={{ color: "#1e3a4a" }}>Sou Empresa</div>
                <div className="text-xs mt-0.5" style={{ color: "#7a9aaa" }}>Gestão de campanhas e resultados</div>
              </div>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" style={{ color: "#5baa6d" }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Administração */}
            <div
              className="flex items-center gap-4 w-full p-4 rounded-2xl cursor-not-allowed"
              style={{
                border: "1.5px solid #e8f0f5",
                background: "#f8fbfd",
                opacity: 0.6,
              }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#e2edf4" }}>
                <svg className="w-6 h-6" style={{ color: "#7a9aaa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-sm" style={{ color: "#3a5a6a" }}>Administração</div>
                <div className="text-xs mt-0.5" style={{ color: "#aac0cc" }}>Acesso interno All Lives</div>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                style={{ background: "#e8f0f5", color: "#aac0cc" }}>
                Em breve
              </span>
            </div>
          </div>
        </div>

        <Link href="/" className="block text-center text-sm py-2 transition-colors"
          style={{ color: "#aac0cc" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#2e7fa3")}
          onMouseLeave={e => (e.currentTarget.style.color = "#aac0cc")}>
          ← Voltar ao início
        </Link>
      </div>
    </main>
  );
}

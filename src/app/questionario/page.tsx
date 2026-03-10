"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TOPICS, SECTORS, SCALE_LABELS } from "@/data/questionnaire";
import Image from "next/image";
import Link from "next/link";

type Answers = Record<string, number>;
type ViewMode = "all" | "one";

const RISK_STYLE: Record<string, { bg: string; text: string; bar: string }> = {
  LOW:      { bg: "rgba(91,170,109,0.1)",  text: "#3d8a50", bar: "#5baa6d" },
  MEDIUM:   { bg: "rgba(245,158,11,0.1)",  text: "#b45309", bar: "#f59e0b" },
  HIGH:     { bg: "rgba(234,88,12,0.1)",   text: "#c2410c", bar: "#f97316" },
  CRITICAL: { bg: "rgba(220,38,38,0.1)",   text: "#b91c1c", bar: "#ef4444" },
};
const RISK_LABELS: Record<string, string> = {
  LOW: "Baixo", MEDIUM: "Moderado", HIGH: "Alto", CRITICAL: "Crítico",
};

const SCALE_VALS = [
  { val: 0, label: "Nunca",          cls: "selected-0" },
  { val: 1, label: "Raramente",      cls: "selected-1" },
  { val: 2, label: "Ocasionalmente", cls: "selected-2" },
  { val: 3, label: "Frequentemente", cls: "selected-3" },
  { val: 4, label: "Sempre",         cls: "selected-4" },
];

const TOPIC_ICONS = ["🛡️","⚡","🏆","🌤️","🎯","📊","🔒","💬","⚖️"];

function QuestionarioInner() {
  const searchParams = useSearchParams();
  const [step, setStep]               = useState<"intro"|"form"|"done">("intro");
  const [viewMode, setViewMode]       = useState<ViewMode>("one");
  const [currentTopic, setCurrentTopic]   = useState(0);
  const [currentQ, setCurrentQ]           = useState(0);
  const [sector, setSector]           = useState("");
  const [jobTitle, setJobTitle]       = useState("");
  const [answers, setAnswers]         = useState<Answers>({});
  const [comments, setComments]       = useState<Record<number, string>>({});
  const [result, setResult]           = useState<{
    totalScore: number; overallRisk: string;
    scores: { topicId: number; topicName: string; score: number; riskLevel: string }[];
  } | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [slideDir, setSlideDir]       = useState<"right"|"left">("right");
  const [animKey, setAnimKey]         = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

  const CAMPAIGN_ID = searchParams.get("campaign") ?? ""; // fix #8
  const topic = TOPICS[currentTopic];
  const question = topic.questions[currentQ];
  const totalTopics = TOPICS.length;

  const answeredInTopic = topic.questions.filter(q => answers[`${topic.id}-${q.id}`] !== undefined).length;
  const allAnsweredInTopic = answeredInTopic === topic.questions.length;
  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = TOPICS.reduce((s, t) => s + t.questions.length, 0);
  const overallPct = Math.round((totalAnswered / totalQuestions) * 100);

  const scroll = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const anim = (dir: "right"|"left") => {
    setSlideDir(dir);
    setAnimKey(k => k + 1);
    scroll();
  };

  const handleAnswer = (topicId: number, qId: number, val: number) => {
    setAnswers(prev => ({ ...prev, [`${topicId}-${qId}`]: val }));
    if (viewMode === "one") {
      setTimeout(() => {
        if (currentQ < topic.questions.length - 1) { anim("right"); setCurrentQ(q => q + 1); }
      }, 260);
    }
  };

  const goNextTopic = () => { anim("right"); setCurrentTopic(t => t + 1); setCurrentQ(0); };
  const goPrevTopic = () => { anim("left");  setCurrentTopic(t => t - 1); setCurrentQ(0); };
  const goNextQ = () => { anim("right"); setCurrentQ(q => q + 1); };
  const goPrevQ = () => {
    if (currentQ > 0) { anim("left"); setCurrentQ(q => q - 1); }
    else if (currentTopic > 0) { anim("left"); setCurrentTopic(t => t - 1); setCurrentQ(TOPICS[currentTopic-1].questions.length - 1); }
  };

  const handleFinish = async () => {
    setSubmitting(true);
    const formatted = Object.entries(answers).map(([k, v]) => {
      const [topicId, questionId] = k.split("-").map(Number);
      return { topicId, questionId, value: v };
    });
    try {
      const res = await fetch("/api/responses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: CAMPAIGN_ID, sector, jobTitle, answers: formatted, comments }),
      });
      setResult(await res.json());
      setStep("done");
    } catch { alert("Erro ao enviar. Tente novamente."); }
    finally { setSubmitting(false); }
  };

  const isFirst = currentTopic === 0 && currentQ === 0;
  const isLast  = currentTopic === totalTopics - 1 && currentQ === topic.questions.length - 1;
  const answerKey = `${topic.id}-${question?.id}`;

  // ── DONE ────────────────────────────────────────────────────────────────
  if (step === "done" && result) {
    return (
      <main className="min-h-screen gradient-hero flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full pop-in">
          <div className="card-3d p-8 text-center mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(91,170,109,0.12)", border: "2px solid rgba(91,170,109,0.3)" }}>
              <svg className="w-8 h-8" style={{ color: "#5baa6d" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold mb-1" style={{ color: "#1e3a4a" }}>Questionário Concluído!</h1>
            <p className="text-sm" style={{ color: "#7a9aaa" }}>
              Obrigado pela participação. Suas respostas foram registradas de forma anônima.
            </p>
          </div>

          <div className="card-3d p-6 mb-4">
            <h2 className="text-sm font-bold mb-4" style={{ color: "#1e5f7a" }}>Resultado por tópico</h2>
            <div className="space-y-3 stagger">
              {result.scores.map(s => {
                const rs = RISK_STYLE[s.riskLevel];
                return (
                  <div key={s.topicId} className="fade-up">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium" style={{ color: "#3a5a6a" }}>{s.topicName}</span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                        style={{ background: rs.bg, color: rs.text }}>
                        {RISK_LABELS[s.riskLevel]}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "#e8f0f5" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${s.score}%`, background: rs.bar }} />
                    </div>
                  </div>
                );
              })}
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

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <main className="min-h-screen gradient-hero flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full fade-up">
          <div className="flex justify-center mb-8">
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
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#1e3a4a" }}>
              Avaliação de Riscos Psicossociais
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: "#5b9ec9" }}>
              DRPS — NR-01
            </p>

            {/* Info box */}
            <div className="rounded-2xl p-4 mb-6"
              style={{ background: "rgba(91,158,201,0.07)", border: "1.5px solid rgba(91,158,201,0.2)" }}>
              <p className="text-sm leading-relaxed" style={{ color: "#2e5a70" }}>
                <span className="font-semibold">Bem-vindo(a).</span> Sua participação é voluntária.
                As respostas são <span className="font-semibold">confidenciais e anônimas</span>, conforme a LGPD.
                Você responderá <strong>9 tópicos</strong> com 10 questões cada.
              </p>
            </div>

            {/* Scale */}
            <div className="mb-6">
              <p className="text-xs font-semibold mb-2" style={{ color: "#7a9aaa" }}>Escala de resposta</p>
              <div className="flex gap-1.5">
                {SCALE_VALS.map(s => (
                  <div key={s.val} className="flex-1 rounded-xl p-2 text-center"
                    style={{ background: "#f4f8fb", border: "1.5px solid #e2edf4" }}>
                    <div className="text-sm font-bold" style={{ color: "#1e5f7a" }}>{s.val}</div>
                    <div className="text-[9px] mt-0.5 leading-tight" style={{ color: "#7a9aaa" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mode toggle */}
            <div className="mb-6">
              <p className="text-xs font-semibold mb-2" style={{ color: "#7a9aaa" }}>Modo de exibição</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "one", icon: "➡️", title: "Uma por vez", sub: "Avança automaticamente" },
                  { id: "all", icon: "☰",  title: "Todas de uma vez", sub: "Veja a seção inteira" },
                ].map(m => (
                  <button key={m.id} onClick={() => setViewMode(m.id as ViewMode)}
                    className="flex items-center gap-3 p-3 rounded-2xl text-left transition-all"
                    style={{
                      border: viewMode === m.id ? "1.5px solid #2e7fa3" : "1.5px solid #e2edf4",
                      background: viewMode === m.id ? "rgba(46,127,163,0.06)" : "white",
                      boxShadow: viewMode === m.id ? "0 2px 12px rgba(46,127,163,0.15)" : "none",
                    }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 transition-all"
                      style={{ background: viewMode === m.id ? "linear-gradient(135deg,#2e7fa3,#1e5f7a)" : "#f0f4f7" }}>
                      <span style={{ filter: viewMode === m.id ? "brightness(10)" : "none" }}>{m.icon}</span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: viewMode === m.id ? "#1e5f7a" : "#3a5a6a" }}>
                        {m.title}
                      </div>
                      <div className="text-[10px]" style={{ color: "#aac0cc" }}>{m.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>
                  Cargo / Função
                </label>
                <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                  placeholder="Ex: Analista, Operador..."
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    border: "1.5px solid #e2edf4", background: "#f8fbfd", color: "#1e3a4a",
                  }}
                  onFocus={e => { e.target.style.borderColor = "#5b9ec9"; e.target.style.boxShadow = "0 0 0 3px rgba(91,158,201,0.15)"; }}
                  onBlur={e  => { e.target.style.borderColor = "#e2edf4"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>
                  Setor <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <select value={sector} onChange={e => setSector(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{ border: "1.5px solid #e2edf4", background: "#f8fbfd", color: sector ? "#1e3a4a" : "#aac0cc" }}
                  onFocus={e => { e.target.style.borderColor = "#5b9ec9"; e.target.style.boxShadow = "0 0 0 3px rgba(91,158,201,0.15)"; }}
                  onBlur={e  => { e.target.style.borderColor = "#e2edf4"; e.target.style.boxShadow = "none"; }}>
                  <option value="">Selecione seu setor</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <button disabled={!sector} onClick={() => setStep("form")}
              className="btn-primary w-full flex items-center justify-center gap-2">
              Iniciar questionário
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <p className="text-center text-xs" style={{ color: "#c0d0da" }}>
            9 tópicos · 90 questões · ~15 minutos
          </p>
        </div>
      </main>
    );
  }

  // ── FORM ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen gradient-hero pb-24" ref={topRef}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b"
        style={{ borderColor: "rgba(91,158,201,0.15)", boxShadow: "0 2px 16px rgba(30,95,122,0.07)" }}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/"
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
              style={{ background: "#f0f8ff", border: "1.5px solid rgba(91,158,201,0.2)" }}>
              <svg className="w-4 h-4" style={{ color: "#2e7fa3" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            {/* Progress segments */}
            <div className="flex gap-1 flex-1 overflow-hidden">
              {TOPICS.map((_, i) => (
                <div key={i} className="rounded-full transition-all duration-500"
                  style={{
                    height: 6,
                    flex: i === currentTopic ? 3 : 1,
                    background: i < currentTopic ? "#5baa6d" : i === currentTopic ? "linear-gradient(90deg,#2e7fa3,#5b9ec9)" : "#dce8f0",
                  }} />
              ))}
            </div>

            <span className="text-xs font-bold tabular-nums flex-shrink-0" style={{ color: "#2e7fa3" }}>
              {overallPct}%
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div key={`topic-${currentTopic}-${animKey}`}
          className={slideDir === "right" ? "slide-in-right" : "slide-in-left"}>

          {/* Topic header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="topic-icon">{TOPIC_ICONS[currentTopic]}</div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#5b9ec9" }}>
                Tópico {String(currentTopic + 1).padStart(2,"0")} de {totalTopics}
              </p>
              <h2 className="text-base font-bold" style={{ color: "#1e3a4a" }}>{topic.title}</h2>
            </div>
            {allAnsweredInTopic && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(91,170,109,0.15)", border: "2px solid rgba(91,170,109,0.35)" }}>
                <svg className="w-4 h-4" style={{ color: "#5baa6d" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          {/* ── ONE AT A TIME ────────────────────────────────────────────── */}
          {viewMode === "one" && (
            <div key={`q-${currentTopic}-${currentQ}-${animKey}`}
              className={slideDir === "right" ? "slide-in-right" : "slide-in-left"}>

              {/* Q dots */}
              <div className="flex gap-1 mb-5">
                {topic.questions.map((q, i) => (
                  <button key={q.id}
                    onClick={() => { anim(i > currentQ ? "right" : "left"); setCurrentQ(i); }}
                    className="flex-1 rounded-full transition-all duration-200"
                    style={{
                      height: 5,
                      background: i < currentQ ? "#5baa6d"
                        : i === currentQ ? "linear-gradient(90deg,#2e7fa3,#5b9ec9)"
                        : answers[`${topic.id}-${q.id}`] !== undefined ? "#a8d4ea"
                        : "#dce8f0",
                    }} />
                ))}
              </div>

              {/* Question card */}
              <div className="card-3d p-6 mb-4">
                <p className="text-xs font-semibold mb-3" style={{ color: "#aac0cc" }}>
                  Questão {currentQ + 1} de {topic.questions.length}
                </p>
                <p className="font-semibold text-base leading-relaxed mb-6" style={{ color: "#1e3a4a" }}>
                  {question.text}
                </p>

                <div className="grid grid-cols-5 gap-2">
                  {SCALE_VALS.map(s => {
                    const sel = answers[answerKey] === s.val;
                    return (
                      <button key={s.val}
                        onClick={() => handleAnswer(topic.id, question.id, s.val)}
                        className={`scale-btn ${sel ? s.cls : ""}`}>
                        <div className="text-base font-bold" style={{ color: sel ? "white" : "#1e5f7a" }}>{s.val}</div>
                        <div className="text-[9px] font-medium mt-0.5 leading-tight"
                          style={{ color: sel ? "rgba(255,255,255,0.8)" : "#7a9aaa" }}>{s.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment when topic complete */}
              {allAnsweredInTopic && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>
                    💬 Comentário sobre este tópico <span style={{ color: "#aac0cc" }}>(opcional)</span>
                  </label>
                  <textarea
                    value={comments[topic.id] ?? ""}
                    onChange={(e) => setComments(prev => ({ ...prev, [topic.id]: e.target.value }))}
                    placeholder="Deseja acrescentar algo? Sua resposta é anônima."
                    rows={2}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none transition-all"
                    style={{ border: "1.5px solid #e2edf4", background: "#f8fbfd", color: "#1e3a4a" }}
                    onFocus={e => { e.target.style.borderColor = "#5b9ec9"; e.target.style.boxShadow = "0 0 0 3px rgba(91,158,201,0.1)"; }}
                    onBlur={e  => { e.target.style.borderColor = "#e2edf4"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              )}

              {/* Nav */}
              <div className="flex justify-between items-center">
                <button onClick={isFirst ? undefined : goPrevQ} disabled={isFirst}
                  className="btn-ghost flex items-center gap-1.5 px-4 py-2.5 text-sm"
                  style={{ opacity: isFirst ? 0 : 1 }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Anterior
                </button>

                <span className="text-xs font-medium" style={{ color: "#aac0cc" }}>
                  {answeredInTopic}/{topic.questions.length}
                </span>

                {allAnsweredInTopic ? (
                  currentTopic < totalTopics - 1 ? (
                    <button onClick={goNextTopic} className="btn-primary flex items-center gap-1.5 px-5 py-2.5 text-sm">
                      Próximo tópico
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <button onClick={handleFinish} disabled={submitting} className="btn-green flex items-center gap-1.5 px-5 py-2.5 text-sm">
                      {submitting ? "Enviando..." : "Finalizar"}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )
                ) : answers[answerKey] !== undefined && !isLast ? (
                  <button onClick={goNextQ}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all"
                    style={{ color: "#2e7fa3" }}>
                    Próxima
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : <div />}
              </div>
            </div>
          )}

          {/* ── ALL AT ONCE ──────────────────────────────────────────────── */}
          {viewMode === "all" && (
            <div>
              <div className="space-y-3 mb-5 stagger">
                {topic.questions.map(q => {
                  const key = `${topic.id}-${q.id}`;
                  const sel = answers[key];
                  return (
                    <div key={q.id} className="card-3d-sm p-5 fade-up">
                      <p className="text-sm font-semibold leading-relaxed mb-4" style={{ color: "#1e3a4a" }}>
                        <span className="font-bold mr-1.5" style={{ color: "#5b9ec9" }}>{q.id}.</span>
                        {q.text}
                      </p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {SCALE_VALS.map(s => {
                          const isSelected = sel === s.val;
                          return (
                            <button key={s.val}
                              onClick={() => handleAnswer(topic.id, q.id, s.val)}
                              className={`scale-btn ${isSelected ? s.cls : ""}`}>
                              <div className="text-sm font-bold" style={{ color: isSelected ? "white" : "#1e5f7a" }}>{s.val}</div>
                              <div className="text-[9px] font-medium mt-0.5 leading-tight"
                                style={{ color: isSelected ? "rgba(255,255,255,0.8)" : "#7a9aaa" }}>{s.label}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comment field */}
              <div className="mb-5">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9aaa" }}>
                  💬 Comentário sobre este tópico <span style={{ color: "#aac0cc" }}>(opcional)</span>
                </label>
                <textarea
                  value={comments[topic.id] ?? ""}
                  onChange={(e) => setComments(prev => ({ ...prev, [topic.id]: e.target.value }))}
                  placeholder="Deseja acrescentar algo? Sua resposta é anônima."
                  rows={2}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none transition-all"
                  style={{ border: "1.5px solid #e2edf4", background: "#f8fbfd", color: "#1e3a4a" }}
                  onFocus={e => { e.target.style.borderColor = "#5b9ec9"; e.target.style.boxShadow = "0 0 0 3px rgba(91,158,201,0.1)"; }}
                  onBlur={e  => { e.target.style.borderColor = "#e2edf4"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              <div className="flex justify-between items-center">
                <button onClick={currentTopic > 0 ? goPrevTopic : undefined} disabled={currentTopic === 0}
                  className="btn-ghost flex items-center gap-1.5 px-4 py-2.5 text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Anterior
                </button>

                <span className="text-xs font-medium" style={{ color: "#aac0cc" }}>
                  {answeredInTopic}/{topic.questions.length} respondidas
                </span>

                {currentTopic < totalTopics - 1 ? (
                  <button onClick={allAnsweredInTopic ? goNextTopic : undefined} disabled={!allAnsweredInTopic}
                    className="btn-primary flex items-center gap-1.5 px-5 py-2.5 text-sm">
                    Próximo tópico
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button onClick={allAnsweredInTopic ? handleFinish : undefined} disabled={!allAnsweredInTopic || submitting}
                    className="btn-green flex items-center gap-1.5 px-5 py-2.5 text-sm">
                    {submitting ? "Enviando..." : "Finalizar"}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// fix #8 — useSearchParams requires Suspense boundary
export default function QuestionarioPage() {
  return (
    <Suspense>
      <QuestionarioInner />
    </Suspense>
  );
}

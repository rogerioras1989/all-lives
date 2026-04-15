import { describe, it, expect } from "vitest";
import {
  TOPICS,
  calculateTopicScore,
  getRiskLevel,
  RISK_LABELS,
} from "./questionnaire";

describe("getRiskLevel", () => {
  it("classifica score 0 como LOW", () => {
    expect(getRiskLevel(0)).toBe("LOW");
  });

  it("classifica score 25 como LOW (limite superior)", () => {
    expect(getRiskLevel(25)).toBe("LOW");
  });

  it("classifica score 26 como MEDIUM", () => {
    expect(getRiskLevel(26)).toBe("MEDIUM");
  });

  it("classifica score 50 como MEDIUM (limite superior)", () => {
    expect(getRiskLevel(50)).toBe("MEDIUM");
  });

  it("classifica score 51 como HIGH", () => {
    expect(getRiskLevel(51)).toBe("HIGH");
  });

  it("classifica score 75 como HIGH (limite superior)", () => {
    expect(getRiskLevel(75)).toBe("HIGH");
  });

  it("classifica score 76 como CRITICAL", () => {
    expect(getRiskLevel(76)).toBe("CRITICAL");
  });

  it("classifica score 100 como CRITICAL", () => {
    expect(getRiskLevel(100)).toBe("CRITICAL");
  });

  it("possui label PT-BR para todos os níveis", () => {
    expect(RISK_LABELS.LOW).toBeTruthy();
    expect(RISK_LABELS.MEDIUM).toBeTruthy();
    expect(RISK_LABELS.HIGH).toBeTruthy();
    expect(RISK_LABELS.CRITICAL).toBeTruthy();
  });
});

describe("calculateTopicScore", () => {
  const topic = TOPICS[0];
  const directQuestion = topic.questions.find((q) => !q.reversed);
  const reversedQuestion = topic.questions.find((q) => q.reversed);

  it("retorna 0 para topicId desconhecido", () => {
    expect(calculateTopicScore(99999, [{ questionId: 1, value: 4 }])).toBe(0);
  });

  it("retorna 0 quando não há respostas válidas", () => {
    expect(calculateTopicScore(topic.id, [])).toBe(0);
  });

  it("ignora respostas para questionId inexistente", () => {
    expect(
      calculateTopicScore(topic.id, [{ questionId: 999, value: 4 }])
    ).toBe(0);
  });

  it("calcula score 0 quando todas as respostas são 0 em perguntas diretas", () => {
    if (!directQuestion) throw new Error("teste exige uma pergunta direta");
    expect(
      calculateTopicScore(topic.id, [
        { questionId: directQuestion.id, value: 0 },
      ])
    ).toBe(0);
  });

  it("calcula score 100 quando todas as respostas são 4 em perguntas diretas", () => {
    if (!directQuestion) throw new Error("teste exige uma pergunta direta");
    expect(
      calculateTopicScore(topic.id, [
        { questionId: directQuestion.id, value: 4 },
      ])
    ).toBe(100);
  });

  it("inverte a pontuação para perguntas reversed", () => {
    if (!reversedQuestion) throw new Error("teste exige uma pergunta reversed");
    // Em pergunta reversed, value=0 deve gerar score 100 (pior cenário)
    expect(
      calculateTopicScore(topic.id, [
        { questionId: reversedQuestion.id, value: 0 },
      ])
    ).toBe(100);
    // E value=4 deve gerar score 0 (melhor cenário)
    expect(
      calculateTopicScore(topic.id, [
        { questionId: reversedQuestion.id, value: 4 },
      ])
    ).toBe(0);
  });

  it("score sempre permanece entre 0 e 100", () => {
    for (const t of TOPICS) {
      const allMin = t.questions.map((q) => ({ questionId: q.id, value: 0 }));
      const allMax = t.questions.map((q) => ({ questionId: q.id, value: 4 }));
      const minScore = calculateTopicScore(t.id, allMin);
      const maxScore = calculateTopicScore(t.id, allMax);
      expect(minScore).toBeGreaterThanOrEqual(0);
      expect(minScore).toBeLessThanOrEqual(100);
      expect(maxScore).toBeGreaterThanOrEqual(0);
      expect(maxScore).toBeLessThanOrEqual(100);
    }
  });
});

describe("estrutura do TOPICS", () => {
  it("todos os tópicos têm id único", () => {
    const ids = TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todos os tópicos têm pelo menos uma pergunta", () => {
    for (const topic of TOPICS) {
      expect(topic.questions.length).toBeGreaterThan(0);
    }
  });

  it("todas as perguntas dentro de um tópico têm id único", () => {
    for (const topic of TOPICS) {
      const ids = topic.questions.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

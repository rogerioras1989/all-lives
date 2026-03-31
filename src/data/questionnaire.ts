export const SCALE_LABELS = {
  0: "Nunca",
  1: "Raramente",
  2: "Ocasionalmente",
  3: "Frequentemente",
  4: "Sempre",
} as const;

export const SECTORS = [
  "Produção",
  "Administrativo",
  "Recursos Humanos",
  "Comercial",
  "ETC",
];

export interface Question {
  id: number;
  text: string;
  reversed?: boolean; // se true, pontuação invertida (maior valor = menor risco)
}

export interface Topic {
  id: number;
  title: string;
  description: string;
  questions: Question[];
}

export const TOPICS: Topic[] = [
  {
    id: 1,
    title: "Assédio",
    description:
      "Avalia a severidade, gravidade e probabilidade de ocorrência do risco de assédio.",
    questions: [
      {
        id: 1,
        text: "Você já presenciou ou sofreu comentários ofensivos, piadas ou insinuações inadequadas no ambiente de trabalho?",
      },
      {
        id: 2,
        text: "Você se sente à vontade para relatar situações de assédio moral ou sexual na empresa sem medo de represálias?",
        reversed: true,
      },
      {
        id: 3,
        text: "Existe um canal seguro e sigiloso para denunciar assédio na empresa?",
        reversed: true,
      },
      {
        id: 4,
        text: "Você já recebeu tratamento desrespeitoso ou humilhante de colegas ou superiores?",
      },
      {
        id: 5,
        text: "Você sente que há favoritismo ou perseguição por parte da liderança?",
      },
      {
        id: 6,
        text: "Há casos conhecidos de assédio moral ou sexual que não foram devidamente investigados ou punidos?",
      },
      {
        id: 7,
        text: "A empresa realiza treinamentos ou campanhas de conscientização sobre assédio?",
        reversed: true,
      },
      {
        id: 8,
        text: "O RH e os gestores demonstram comprometimento real com a prevenção do assédio?",
        reversed: true,
      },
      {
        id: 9,
        text: "Você já foi forçado(a) a realizar tarefas humilhantes ou degradantes?",
      },
      {
        id: 10,
        text: "Existe uma cultura de 'brincadeiras' que desrespeitam funcionários? Já foi vítima de alguma delas?",
      },
    ],
  },
  {
    id: 2,
    title: "Carga Excessiva de Trabalho",
    description:
      "Avalia a severidade, gravidade e probabilidade de ocorrência do risco de exaustão por carga excessiva de trabalho.",
    questions: [
      {
        id: 1,
        text: "Você sente que sua carga de trabalho diária é superior à sua capacidade de execução dentro do horário normal?",
      },
      {
        id: 2,
        text: "Você frequentemente precisa fazer horas extras ou levar trabalho para casa?",
      },
      {
        id: 3,
        text: "As demandas e prazos estabelecidos são realistas e atingíveis?",
        reversed: true,
      },
      {
        id: 4,
        text: "Você sente que a empresa respeita seus limites físicos e mentais?",
        reversed: true,
      },
      {
        id: 5,
        text: "Você recebe pausas adequadas ao longo do dia?",
        reversed: true,
      },
      {
        id: 6,
        text: "Existe um equilíbrio entre tarefas administrativas e operacionais?",
        reversed: true,
      },
      {
        id: 7,
        text: "Há redistribuição de tarefas quando há sobrecarga em algum setor ou equipe?",
        reversed: true,
      },
      {
        id: 8,
        text: "Você já teve sintomas físicos ou emocionais (como ansiedade, exaustão, insônia) devido ao excesso de trabalho?",
      },
      {
        id: 9,
        text: "Existe flexibilidade para gerenciar sua própria carga de trabalho?",
        reversed: true,
      },
      {
        id: 10,
        text: "A equipe é dimensionada (quantidade necessária de funcionários por função) corretamente para a demanda da empresa?",
        reversed: true,
      },
    ],
  },
  {
    id: 3,
    title: "Reconhecimento e Recompensas",
    description:
      "Avalia a severidade, gravidade e probabilidade de ocorrência do risco de desmotivação e tristeza pela falta de reconhecimento e recompensas.",
    questions: [
      {
        id: 1,
        text: "Você sente que seu esforço e desempenho são reconhecidos pela liderança?",
        reversed: true,
      },
      {
        id: 2,
        text: "A empresa possui políticas claras de promoção e progressão de carreira?",
        reversed: true,
      },
      {
        id: 3,
        text: "As avaliações de desempenho são justas e transparentes?",
        reversed: true,
      },
      {
        id: 4,
        text: "Você sente que há igualdade no reconhecimento entre diferentes áreas ou equipes?",
        reversed: true,
      },
      {
        id: 5,
        text: "A empresa oferece incentivos financeiros ou não financeiros pelo bom desempenho?",
        reversed: true,
      },
      {
        id: 6,
        text: "Você recebe feedback construtivo regularmente?",
        reversed: true,
      },
      {
        id: 7,
        text: "Existe uma cultura de valorização dos funcionários?",
        reversed: true,
      },
      {
        id: 8,
        text: "Você já se sentiu desmotivado(a) por falta de reconhecimento?",
      },
      {
        id: 9,
        text: "A empresa celebra conquistas individuais e coletivas?",
        reversed: true,
      },
      {
        id: 10,
        text: "O plano de benefícios da empresa é condizente com suas necessidades e expectativas?",
        reversed: true,
      },
    ],
  },
  {
    id: 4,
    title: "Clima Organizacional",
    description:
      "Avalia as características do clima organizacional que contribuem para o bem-estar emocional dos colaboradores.",
    questions: [
      {
        id: 1,
        text: "O ambiente de trabalho é amigável e colaborativo?",
        reversed: true,
      },
      {
        id: 2,
        text: "Existe um sentimento de confiança entre os colegas de trabalho?",
        reversed: true,
      },
      {
        id: 3,
        text: "Você se sente confortável para expressar suas opiniões na equipe?",
        reversed: true,
      },
      {
        id: 4,
        text: "Os gestores promovem um ambiente saudável e respeitoso?",
        reversed: true,
      },
      {
        id: 5,
        text: "Existe transparência na comunicação da empresa?",
        reversed: true,
      },
      {
        id: 6,
        text: "Você sente que pode contar com seus colegas em momentos de dificuldade?",
        reversed: true,
      },
      {
        id: 7,
        text: "Há um senso de propósito e pertencimento entre os funcionários?",
        reversed: true,
      },
      {
        id: 8,
        text: "Conflitos são resolvidos de forma justa e eficiente?",
        reversed: true,
      },
      {
        id: 9,
        text: "O ambiente físico do local de trabalho é confortável e seguro?",
        reversed: true,
      },
      {
        id: 10,
        text: "A cultura organizacional da empresa está alinhada com seus valores pessoais?",
        reversed: true,
      },
    ],
  },
  {
    id: 5,
    title: "Autonomia e Controle sobre o Trabalho",
    description:
      "Avalia as características dos processos de trabalho, a fim de averiguar o nível de conforto e liberdade dos colaboradores ao desempenhar suas atividades.",
    questions: [
      {
        id: 1,
        text: "Você tem liberdade para tomar decisões sobre suas tarefas diárias?",
        reversed: true,
      },
      {
        id: 2,
        text: "Seu trabalho permite flexibilidade para adaptar sua rotina conforme necessário?",
        reversed: true,
      },
      {
        id: 3,
        text: "Você sente que tem voz ativa na empresa?",
        reversed: true,
      },
      {
        id: 4,
        text: "A empresa confia em sua capacidade de autogestão?",
        reversed: true,
      },
      {
        id: 5,
        text: "Você recebe instruções claras sobre suas responsabilidades?",
        reversed: true,
      },
      {
        id: 6,
        text: "O excesso de controle ou burocracia interfere no seu desempenho?",
      },
      {
        id: 7,
        text: "Suas sugestões são ouvidas e consideradas pela liderança?",
        reversed: true,
      },
      {
        id: 8,
        text: "Você tem acesso às ferramentas e recursos necessários para desempenhar bem seu trabalho?",
        reversed: true,
      },
      {
        id: 9,
        text: "Você sente que pode propor melhorias sem medo de represálias?",
        reversed: true,
      },
      {
        id: 10,
        text: "O excesso de supervisão impacta sua produtividade ou bem-estar?",
      },
    ],
  },
  {
    id: 6,
    title: "Pressão e Metas",
    description:
      "Avalia como as metas de trabalho afetam a saúde mental dos colaboradores.",
    questions: [
      {
        id: 1,
        text: "As metas da empresa são realistas e atingíveis?",
        reversed: true,
      },
      {
        id: 2,
        text: "Você sente que há pressão excessiva para alcançar resultados?",
      },
      {
        id: 3,
        text: "A cobrança por metas impacta sua saúde mental ou emocional?",
      },
      {
        id: 4,
        text: "Existe apoio da liderança para lidar com desafios relacionados às metas?",
        reversed: true,
      },
      {
        id: 5,
        text: "Você sente que pode negociar prazos ou objetivos quando necessário?",
        reversed: true,
      },
      {
        id: 6,
        text: "A competitividade entre os funcionários é estimulada de maneira saudável?",
        reversed: true,
      },
      {
        id: 7,
        text: "Você já sentiu medo de punição por não atingir metas?",
      },
      {
        id: 8,
        text: "O sistema de avaliação de metas é transparente?",
        reversed: true,
      },
      {
        id: 9,
        text: "Você tem tempo suficiente para cumprir suas demandas com qualidade?",
        reversed: true,
      },
      {
        id: 10,
        text: "A pressão por resultados impacta negativamente o ambiente de trabalho?",
      },
    ],
  },
  {
    id: 7,
    title: "Insegurança e Ameaças",
    description:
      "Avalia o nível de sentimento de insegurança e a presença de fatores ameaçadores à estabilidade emocional dos colaboradores.",
    questions: [
      {
        id: 1,
        text: "Você já sentiu que seu emprego está ameaçado sem justificativa clara?",
      },
      {
        id: 2,
        text: "A empresa faz cortes ou demissões repentinas sem aviso prévio?",
      },
      {
        id: 3,
        text: "Há comunicação clara sobre a estabilidade da empresa e dos empregos?",
        reversed: true,
      },
      {
        id: 4,
        text: "Você já sofreu ameaças veladas ou diretas no ambiente de trabalho?",
      },
      {
        id: 5,
        text: "Você sente que há transparência nas políticas de desligamento?",
        reversed: true,
      },
      {
        id: 6,
        text: "Mudanças organizacionais impactaram seu sentimento de segurança no trabalho?",
      },
      {
        id: 7,
        text: "Você já presenciou casos de demissões injustas?",
      },
      {
        id: 8,
        text: "O medo da demissão afeta seu desempenho?",
      },
      {
        id: 9,
        text: "A empresa oferece suporte psicológico para funcionários inseguros?",
        reversed: true,
      },
      {
        id: 10,
        text: "Você já evitou expressar sua opinião por medo de represálias?",
      },
    ],
  },
  {
    id: 8,
    title: "Conflitos Interpessoais e Falta de Comunicação",
    description:
      "Identifica a presença e severidade de possíveis conflitos no ambiente de trabalho e prejuízos devido à falta de comunicação.",
    questions: [
      {
        id: 1,
        text: "Conflitos internos são resolvidos de maneira justa?",
        reversed: true,
      },
      {
        id: 2,
        text: "A comunicação entre equipes e departamentos é eficiente?",
        reversed: true,
      },
      {
        id: 3,
        text: "Você já evitou colegas ou superiores devido a desentendimentos?",
      },
      {
        id: 4,
        text: "Existe um canal aberto para feedback entre colaboradores e liderança?",
        reversed: true,
      },
      {
        id: 5,
        text: "A falta de comunicação já comprometeu seu trabalho?",
      },
      {
        id: 6,
        text: "Você sente que há rivalidade desnecessária entre setores?",
      },
      {
        id: 7,
        text: "Há treinamentos sobre comunicação assertiva e gestão de conflitos?",
        reversed: true,
      },
      {
        id: 8,
        text: "Você sente que pode expressar suas dificuldades sem ser julgado?",
        reversed: true,
      },
      {
        id: 9,
        text: "A empresa promove um ambiente de diálogo aberto?",
        reversed: true,
      },
      {
        id: 10,
        text: "O RH está presente e atuante na mediação de conflitos?",
        reversed: true,
      },
    ],
  },
  {
    id: 9,
    title: "Alinhamento entre Vida Pessoal e Profissional",
    description:
      "Avalia o nível de atendimento da conciliação entre vida pessoal e profissional dos trabalhadores, mediante as condições de trabalho impostas.",
    questions: [
      {
        id: 1,
        text: "Você sente que a sua jornada de trabalho permite equilíbrio com sua vida pessoal?",
        reversed: true,
      },
      {
        id: 2,
        text: "Você sente que tem tempo para sua família e lazer?",
        reversed: true,
      },
      {
        id: 3,
        text: "O trabalho impacta negativamente sua saúde mental?",
      },
      {
        id: 4,
        text: "Você tem flexibilidade para lidar com questões pessoais urgentes?",
        reversed: true,
      },
      {
        id: 5,
        text: "A empresa oferece suporte para equilíbrio entre trabalho e vida pessoal?",
        reversed: true,
      },
      {
        id: 6,
        text: "Você consegue se desconectar do trabalho fora do expediente?",
        reversed: true,
      },
      {
        id: 7,
        text: "Você sente que sua vida pessoal é respeitada pela empresa?",
        reversed: true,
      },
      {
        id: 8,
        text: "Há incentivo ao bem-estar e qualidade de vida no trabalho?",
        reversed: true,
      },
      {
        id: 9,
        text: "O estresse profissional afeta sua vida familiar?",
      },
      {
        id: 10,
        text: "O ambiente corporativo valoriza o descanso e recuperação dos funcionários?",
        reversed: true,
      },
    ],
  },
];

export function calculateTopicScore(
  topicId: number,
  answers: { questionId: number; value: number }[]
): number {
  const topic = TOPICS.find((t) => t.id === topicId);
  if (!topic) return 0;

  let totalScore = 0;
  let count = 0;

  for (const answer of answers) {
    const question = topic.questions.find((q) => q.id === answer.questionId);
    if (!question) continue;

    const value = question.reversed ? 4 - answer.value : answer.value;
    totalScore += value;
    count++;
  }

  if (count === 0) return 0;
  return (totalScore / (count * 4)) * 100;
}

export function getRiskLevel(score: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (score <= 25) return "LOW";
  if (score <= 50) return "MEDIUM";
  if (score <= 75) return "HIGH";
  return "CRITICAL";
}

export const RISK_LABELS = {
  LOW: "Baixo",
  MEDIUM: "Moderado",
  HIGH: "Alto",
  CRITICAL: "Crítico",
};

export const RISK_COLORS = {
  LOW: "#22c55e",
  MEDIUM: "#eab308",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

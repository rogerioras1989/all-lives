export const SCALE_LABELS = {
  0: "Nunca",
  1: "Raramente",
  2: "Ocasionalmente",
  3: "Frequentemente",
  4: "Sempre",
} as const;

export const SECTORS = [
  "Administrativo",
  "RH",
  "Comercial",
];

export interface Question {
  id: number;
  text: string;
  hint?: string;
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
    title: "Assédio de Qualquer Natureza",
    description:
      "Este tópico visa verificar se o colaborador vivencia ou presencia situações de assédio moral, sexual ou qualquer conduta desrespeitosa no ambiente de trabalho.",
    questions: [
      {
        id: 1,
        text: "Você já presenciou ou sofreu comentários ofensivos, piadas ou insinuações inadequadas no ambiente de trabalho?",
        hint: "Responda pensando se já presenciou ou sofreu esse tipo de situação no trabalho.",
      },
      {
        id: 2,
        text: "Você se sente à vontade para relatar situações de assédio moral ou sexual na empresa sem medo de represálias?",
        hint: "Responda se você se sente seguro(a) para relatar situações de assédio na empresa.",
        reversed: true,
      },
      {
        id: 3,
        text: "Existe um canal seguro e sigiloso para denunciar assédio na empresa?",
        hint: "Responda se a empresa oferece um meio seguro para denunciar assédio e outras situações.",
        reversed: true,
      },
      {
        id: 4,
        text: "Há casos conhecidos de assédio moral ou sexual que não foram devidamente investigados ou punidos?",
        hint: "Responda se você percebe que situações de assédio não são tratadas corretamente.",
      },
      {
        id: 5,
        text: "O RH e os gestores demonstram comprometimento real com a prevenção do assédio?",
        reversed: true,
      },
    ],
  },
  {
    id: 2,
    title: "Suporte e Apoio no Ambiente de Trabalho",
    description:
      "Este tópico visa verificar se o colaborador percebe apoio suficiente da liderança e dos colegas para realizar suas atividades.",
    questions: [
      {
        id: 1,
        text: "Você sente que pode contar com seus colegas em momentos de dificuldade?",
        hint: "Responda se você sente que pode contar com seus colegas quando precisa.",
        reversed: true,
      },
      {
        id: 2,
        text: "Existe apoio da liderança para lidar com desafios relacionados ao trabalho?",
        hint: "Responda se seus gestores ajudam quando surgem dificuldades no trabalho.",
        reversed: true,
      },
      {
        id: 3,
        text: "O RH está presente e atuante quando surgem conflitos ou dificuldades no trabalho?",
        hint: "Responda se o RH costuma apoiar quando há conflitos ou problemas.",
        reversed: true,
      },
      {
        id: 4,
        text: "Os gestores promovem um ambiente saudável e respeitoso?",
        hint: "Responda como você avalia o comportamento dos gestores no dia a dia.",
        reversed: true,
      },
      {
        id: 5,
        text: "Você sente que pode expressar suas dificuldades no trabalho sem ser julgado(a)?",
        hint: "Responda se você se sente à vontade para falar sobre dificuldades no trabalho.",
        reversed: true,
      },
    ],
  },
  {
    id: 3,
    title: "Má Gestão de Mudanças Organizacionais",
    description:
      "Este tópico irá verificar como as mudanças na empresa são comunicadas e conduzidas, e se geram insegurança ou dificuldades para os colaboradores.",
    questions: [
      {
        id: 1,
        text: "Mudanças organizacionais impactaram negativamente seu sentimento de segurança no trabalho?",
        hint: "Responda se mudanças na empresa afetaram sua sensação de segurança no trabalho.",
      },
      {
        id: 2,
        text: "Há comunicação clara sobre mudanças que afetam a empresa ou os trabalhadores?",
        hint: "Responda se a empresa costuma explicar bem as mudanças que acontecem.",
        reversed: true,
      },
      {
        id: 3,
        text: "Você já sentiu que seu emprego estava ameaçado sem explicações claras durante períodos de mudança?",
        hint: "Responda se já sentiu insegurança sobre seu emprego durante mudanças.",
      },
      {
        id: 4,
        text: "Existe transparência na comunicação da empresa durante processos de mudança?",
        hint: "Responda se as mudanças são comunicadas de forma clara e aberta.",
        reversed: true,
      },
    ],
  },
  {
    id: 4,
    title: "Baixa Clareza de Papel ou Função",
    description:
      "Este tópico visa verificar se o colaborador entende claramente suas responsabilidades, metas e o que é esperado do seu trabalho.",
    questions: [
      {
        id: 1,
        text: "Você recebe instruções claras sobre suas responsabilidades no trabalho?",
        hint: "Responda se você entende bem quais são suas responsabilidades.",
        reversed: true,
      },
      {
        id: 2,
        text: "A comunicação da empresa ajuda você a entender o que é esperado do seu trabalho?",
        hint: "Responda se a empresa deixa claro o que espera do seu trabalho.",
        reversed: true,
      },
      {
        id: 3,
        text: "A comunicação entre equipes e setores contribui para a clareza das suas tarefas?",
        hint: "Responda se a comunicação entre áreas ajuda no seu trabalho.",
        reversed: true,
      },
      {
        id: 4,
        text: "Você se sente confortável para pedir esclarecimentos quando não entende suas funções ou prioridades?",
        hint: "Responda se você se sente à vontade para perguntar quando não entende algo.",
        reversed: true,
      },
    ],
  },
  {
    id: 5,
    title: "Baixas Recompensas e Reconhecimento",
    description:
      "Este tópico irá verificar se o colaborador se sente valorizado e reconhecido pelo trabalho que realiza.",
    questions: [
      {
        id: 1,
        text: "Você sente que seu esforço e desempenho são reconhecidos pela liderança?",
        hint: "Responda se você se sente valorizado(a) pelo trabalho que realiza.",
        reversed: true,
      },
      {
        id: 2,
        text: "Você recebe feedback construtivo sobre o seu trabalho com regularidade?",
        hint: "Responda se você recebe orientações ou retornos sobre seu trabalho.",
        reversed: true,
      },
      {
        id: 3,
        text: "Com que frequência você já se sentiu desmotivado(a) por falta de reconhecimento no trabalho?",
        hint: "Responda se a falta de reconhecimento já te deixou desmotivado(a).",
      },
    ],
  },
  {
    id: 6,
    title: "Baixo Controle no Trabalho / Falta de Autonomia",
    description:
      "Este tópico visa verificar o quanto o colaborador tem autonomia para organizar suas tarefas e tomar decisões no dia a dia.",
    questions: [
      {
        id: 1,
        text: "Você tem liberdade para tomar decisões sobre como executar suas tarefas diárias?",
        hint: "Responda se você pode sugerir melhorias ou decidir como fazer suas tarefas.",
        reversed: true,
      },
      {
        id: 2,
        text: "A empresa confia na sua capacidade de organizar e gerenciar o próprio trabalho?",
        hint: "Responda se sente que a empresa confia na forma como você organiza seu trabalho.",
        reversed: true,
      },
      {
        id: 3,
        text: "Existe excesso de controle ou burocracia que interfere no seu desempenho?",
        hint: "Responda se regras ou controles atrapalham seu desempenho.",
      },
      {
        id: 4,
        text: "Existe excesso de supervisão que impacta negativamente na sua produtividade ou bem-estar?",
      },
    ],
  },
  {
    id: 7,
    title: "Baixa Justiça Organizacional",
    description:
      "Este tópico irá verificar se o colaborador percebe que as decisões da empresa são justas e aplicadas de forma equilibrada a todos.",
    questions: [
      {
        id: 1,
        text: "Você acha justas e claras as formas que a empresa usa para avaliar o seu trabalho?",
        hint: "Responda se as formas de avaliar seu trabalho são claras e justas.",
        reversed: true,
      },
      {
        id: 2,
        text: "Você sente que há igualdade no reconhecimento entre diferentes áreas ou equipes?",
        hint: "Responda se você percebe tratamento justo entre equipes ou setores.",
        reversed: true,
      },
      {
        id: 3,
        text: "Você sente que há transparência nas decisões de desligamento na empresa?",
        hint: "Responda se a empresa é clara quando ocorrem desligamentos.",
        reversed: true,
      },
      {
        id: 4,
        text: "Você já presenciou casos de demissões que considerasse injustas?",
        hint: "Responda se já presenciou demissões que considerou injustas.",
      },
    ],
  },
  {
    id: 8,
    title: "Eventos Violentos ou Traumáticos",
    description:
      "Este tópico visa verificar se o colaborador já foi exposto a situações de violência, ameaças ou eventos marcantes que possam ter causado impacto emocional.",
    questions: [
      {
        id: 1,
        text: "Você já vivenciou ou presenciou alguma situação de violência grave no trabalho (como agressão física, ameaça séria ou ataque verbal intenso)?",
      },
      {
        id: 2,
        text: "Você já passou por algum evento grave no trabalho (como acidente sério, situação de risco extremo ou episódio muito impactante)?",
        hint: "Responda se já passou por situações muito graves ou perigosas no trabalho.",
      },
      {
        id: 3,
        text: "Alguma situação vivida no trabalho já foi tão marcante que deixou medo, choque ou forte abalo emocional?",
        hint: "Responda se alguma situação no trabalho já te causou forte abalo emocional.",
      },
    ],
  },
  {
    id: 9,
    title: "Baixa Demanda no Trabalho (Subcarga)",
    description:
      "Este tópico irá verificar se o colaborador percebe falta de atividades, desafios ou tarefas suficientes no trabalho.",
    questions: [
      {
        id: 1,
        text: "Você sente que, na maior parte do tempo, tem pouco trabalho a realizar durante sua jornada?",
        hint: "Responda se costuma ter pouco trabalho durante sua jornada.",
      },
      {
        id: 2,
        text: "Você costuma ficar com tempo ocioso no trabalho por falta de tarefas ou demandas claras?",
        hint: "Responda se frequentemente fica sem tarefas para realizar.",
      },
      {
        id: 3,
        text: "Você sente que suas habilidades ou conhecimentos são pouco utilizados no seu trabalho?",
        hint: "Responda se sente que suas habilidades são pouco aproveitadas.",
      },
      {
        id: 4,
        text: "Seu trabalho costuma ser pouco desafiador ou repetitivo a ponto de gerar desânimo?",
        hint: "Responda se o trabalho é repetitivo ou desmotivador.",
      },
    ],
  },
  {
    id: 10,
    title: "Excesso de Demandas no Trabalho (Sobrecarga)",
    description:
      "Este tópico visa verificar se o volume e a pressão das tarefas estão acima do que o colaborador consegue realizar de forma saudável.",
    questions: [
      {
        id: 1,
        text: "Você sente que sua carga de trabalho diária é maior do que consegue realizar dentro do horário normal?",
        hint: "Responda se a quantidade de trabalho é maior do que consegue realizar.",
      },
      {
        id: 2,
        text: "Você frequentemente precisa fazer horas extras ou levar trabalho para casa?",
        hint: "Responda se costuma trabalhar além do horário normal.",
      },
      {
        id: 3,
        text: "Você já teve sintomas físicos ou emocionais (como exaustão, ansiedade ou insônia) devido ao excesso de trabalho?",
        hint: "Responda se o excesso de trabalho já afetou sua saúde.",
      },
      {
        id: 4,
        text: "A equipe é dimensionada corretamente para a demanda de trabalho existente?",
        hint: "Responda se a quantidade de pessoas é suficiente para a demanda.",
        reversed: true,
      },
    ],
  },
  {
    id: 11,
    title: "Maus Relacionamentos no Local de Trabalho",
    description:
      "Este tópico irá verificar se existem conflitos frequentes, clima negativo ou dificuldades nos relacionamentos profissionais.",
    questions: [
      {
        id: 1,
        text: "Você já evitou colegas ou superiores por causa de desentendimentos frequentes?",
        hint: "Responda se já evitou colegas ou superiores por conflitos.",
      },
      {
        id: 2,
        text: "Você percebe rivalidade excessiva ou desnecessária entre colegas ou setores?",
        hint: "Responda se percebe disputas desnecessárias no trabalho.",
      },
      {
        id: 3,
        text: "Conflitos no trabalho costumam ser resolvidos de forma justa?",
        hint: "Responda se os conflitos costumam ser resolvidos de forma justa.",
        reversed: true,
      },
    ],
  },
  {
    id: 12,
    title: "Trabalho em Condições de Difícil Comunicação",
    description:
      "Este tópico visa verificar se existem barreiras que dificultam a comunicação clara entre equipe e liderança.",
    questions: [
      {
        id: 1,
        text: "Você trabalha em condições (como turnos diferentes, trabalho externo ou distância física) que dificultam a comunicação no trabalho?",
        hint: "Responda se seu trabalho dificulta a comunicação com colegas ou líderes.",
      },
      {
        id: 2,
        text: "A distância física entre você e sua equipe ou liderança dificulta a troca de informações?",
        hint: "Responda se a distância atrapalha a troca de informações.",
      },
      {
        id: 3,
        text: "Você já teve dificuldade para receber informações importantes no momento certo por causa da organização do trabalho?",
        hint: "Responda se já recebeu informações importantes com atraso.",
      },
      {
        id: 4,
        text: "Você tem acesso fácil aos meios necessários para se comunicar com colegas e liderança durante o trabalho?",
        hint: "Responda se você tem meios adequados para se comunicar no trabalho.",
        reversed: true,
      },
    ],
  },
  {
    id: 13,
    title: "Trabalho Remoto e Isolado",
    description:
      "Este tópico irá verificar se o trabalho à distância ou em isolamento tem gerado sensação de afastamento, solidão ou dificuldade de integração.",
    questions: [
      {
        id: 1,
        text: "Você trabalha grande parte do tempo de forma remota ou sozinho(a), com pouco contato presencial com colegas ou liderança?",
        hint: "Responda se você trabalha a maior parte do tempo sozinho(a) ou à distância.",
      },
      {
        id: 2,
        text: "Você sente que o trabalho remoto ou isolado faz com que se sinta distante da equipe ou da empresa?",
        hint: "Responda se isso faz você se sentir distante da equipe ou da empresa.",
      },
      {
        id: 3,
        text: "Mesmo trabalhando de forma remota ou isolada, você sente que recebe apoio e acompanhamento adequados da empresa?",
        hint: "Responda se, mesmo à distância, você recebe apoio da empresa.",
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

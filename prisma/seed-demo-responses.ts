/**
 * Seed de respostas demo para apresentação a investidores.
 * Gera 47 respostas realistas com variação por setor.
 * Execute: npx tsx prisma/seed-demo-responses.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { TOPICS, calculateTopicScore, getRiskLevel } from "../src/data/questionnaire";
import crypto from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CAMPAIGN_ID = "campaign-demo";

// Perfis de resposta por setor: valor base (0-4) + variação aleatória
// Valores mais altos = mais risco (para perguntas sem reversed)
const SECTOR_PROFILES: Record<string, { base: number; variance: number }> = {
  Administrativo: { base: 1.2, variance: 0.8 }, // risco baixo/moderado
  RH:             { base: 0.8, variance: 0.6 }, // risco baixo
  Comercial:      { base: 2.1, variance: 1.0 }, // risco moderado/alto
};

const SECTOR_COUNTS: Record<string, number> = {
  Administrativo: 2,
  RH: 1,
  Comercial: 2,
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function generateAnswers(sector: string) {
  const { base, variance } = SECTOR_PROFILES[sector];
  return TOPICS.flatMap((topic) =>
    topic.questions.map((q) => {
      let raw = base + (Math.random() - 0.5) * variance * 2;
      // perguntas reversed tendem a ter score menor (empresa boa = colaborador marca alto)
      if (q.reversed) raw = 4 - base + (Math.random() - 0.5) * variance * 2;
      return {
        topicId: topic.id,
        questionId: q.id,
        value: clamp(raw, 0, 4),
      };
    })
  );
}

function fakeIpHash(i: number): string {
  return crypto.createHash("sha256").update(`fake-ip-${i}`).digest("hex");
}

function randomDate(daysAgoMin: number, daysAgoMax: number): Date {
  const ms = randInt(daysAgoMin, daysAgoMax) * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - ms);
}

const JOB_TITLES: Record<string, string[]> = {
  Administrativo: ["Analista Administrativo", "Assistente de Escritório", "Coordenador Administrativo", "Supervisor Administrativo"],
  RH:             ["Analista de RH", "Gestora de Pessoas", "Técnica de RH", "Coordenadora de RH"],
  Comercial:      ["Executivo de Vendas", "Representante Comercial", "Gerente de Contas", "Consultor de Vendas"],
};

async function main() {
  // Verificar campanha
  const campaign = await prisma.campaign.findUnique({ where: { id: CAMPAIGN_ID } });
  if (!campaign) { console.error("Campanha demo não encontrada. Rode o seed principal primeiro."); process.exit(1); }

  // Limpar respostas existentes
  await prisma.topicComment.deleteMany({ where: { response: { campaignId: CAMPAIGN_ID } } });
  await prisma.topicScore.deleteMany({ where: { response: { campaignId: CAMPAIGN_ID } } });
  await prisma.answer.deleteMany({ where: { response: { campaignId: CAMPAIGN_ID } } });
  await prisma.response.deleteMany({ where: { campaignId: CAMPAIGN_ID } });
  console.log("🗑️  Respostas anteriores removidas.");

  let total = 0;

  for (const [sector, count] of Object.entries(SECTOR_COUNTS)) {
    const titles = JOB_TITLES[sector];
    for (let i = 0; i < count; i++) {
      const answers = generateAnswers(sector);

      const topicScores = TOPICS.map((topic) => {
        const topicAnswers = answers.filter((a) => a.topicId === topic.id);
        const score = calculateTopicScore(topic.id, topicAnswers);
        return { topicId: topic.id, topicName: topic.title, score, riskLevel: getRiskLevel(score) };
      });

      const totalScore = topicScores.reduce((s, t) => s + t.score, 0) / topicScores.length;
      const riskLevel = getRiskLevel(totalScore);
      const jobTitle = titles[i % titles.length];
      const createdAt = randomDate(1, 45);

      await prisma.response.create({
        data: {
          campaignId: CAMPAIGN_ID,
          sector,
          jobTitle,
          totalScore,
          riskLevel,
          ipHash: fakeIpHash(total),
          createdAt,
          answers: { create: answers },
          scores: { create: topicScores },
        },
      });

      total++;
    }
    console.log(`✅ ${count} respostas criadas — ${sector}`);
  }

  console.log(`\n🎉 ${total} respostas demo criadas para a campanha "${campaign.title}"`);
  console.log("   Acesse: http://localhost:3000/acesso/empresa");
  console.log("   Código: demo-empresa | Senha: demo123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

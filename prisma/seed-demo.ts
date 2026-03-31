import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Cria a Empresa Demo (upsert para não duplicar)
  const company = await prisma.company.upsert({
    where: { slug: "empresa-demo" },
    update: {},
    create: {
      name: "Empresa Demo",
      slug: "empresa-demo",
    },
  });

  console.log(`Empresa criada: ${company.name} (id: ${company.id})`);

  // Verifica se já existe campanha ativa
  const existing = await prisma.campaign.findFirst({
    where: { companyId: company.id, status: "ACTIVE" },
  });

  if (existing) {
    console.log(`Campanha ativa já existe: ${existing.title} (id: ${existing.id})`);
    return;
  }

  // Cria campanha ativa
  const campaign = await prisma.campaign.create({
    data: {
      title: "DRPS — Avaliação de Riscos Psicossociais 2025",
      description:
        "Diagnóstico de Riscos Psicossociais (NR-01) — Empresa Demo",
      status: "ACTIVE",
      startDate: new Date(),
      companyId: company.id,
    },
  });

  console.log(`Campanha criada: ${campaign.title} (id: ${campaign.id})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

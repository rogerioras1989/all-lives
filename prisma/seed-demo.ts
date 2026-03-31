import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPasswordHash = await bcrypt.hash("demo1234", 12);

  // Cria a Empresa Demo (upsert para não duplicar)
  const company = await prisma.company.upsert({
    where: { slug: "empresa-demo" },
    update: { adminPasswordHash },
    create: {
      name: "Empresa Demo",
      slug: "empresa-demo",
      adminPasswordHash,
    },
  });

  console.log(`Empresa criada: ${company.name} (id: ${company.id})`);

  // Verifica se já existe campanha ativa
  const existing = await prisma.campaign.findFirst({
    where: { companyId: company.id, status: "ACTIVE" },
  });

  if (existing) {
    console.log(`Campanha ativa já existe: ${existing.title} (id: ${existing.id})`);
  } else {
    const campaign = await prisma.campaign.create({
      data: {
        title: "DRPS — Avaliação de Riscos Psicossociais 2025",
        description: "Diagnóstico de Riscos Psicossociais (NR-01) — Empresa Demo",
        status: "ACTIVE",
        startDate: new Date(),
        companyId: company.id,
      },
    });
    console.log(`Campanha criada: ${campaign.title} (id: ${campaign.id})`);
  }

  // Cria o usuário admin (OWNER) para o painel de Administração
  const adminHash = await bcrypt.hash("admin1234", 12);
  const admin = await prisma.consultant.upsert({
    where: { email: "admin@alllives.com.br" },
    update: { password: adminHash },
    create: {
      name: "All Lives Admin",
      email: "admin@alllives.com.br",
      password: adminHash,
      globalRole: "OWNER",
    },
  });
  console.log(`Admin criado: ${admin.email}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

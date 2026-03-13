import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// fix #4 — usar HMAC-SHA256 com CPF_HMAC_SECRET, idêntico ao auth.ts
function hashCpf(cpf: string) {
  const secret = process.env.CPF_HMAC_SECRET;
  if (!secret) throw new Error("CPF_HMAC_SECRET não definida no .env");
  return crypto.createHmac("sha256", secret).update(cpf.replace(/\D/g, "")).digest("hex");
}

async function main() {
  // Company demo
  const company = await prisma.company.upsert({
    where: { slug: "demo-empresa" },
    update: {},
    create: {
      id: "company-demo",
      name: "Empresa Demo Ltda",
      cnpj: "00.000.000/0001-00",
      slug: "demo-empresa",
    },
  });
  console.log("✅ Company:", company.name);

  // Consultant demo (All Lives)
  const consultantPwHash = await bcrypt.hash("consultor123", 12);
  const consultant = await prisma.consultant.upsert({
    where: { email: "consultor@alllives.com.br" },
    update: {},
    create: {
      id: "consultant-demo",
      name: "Consultor All Lives",
      email: "consultor@alllives.com.br",
      password: consultantPwHash,
    },
  });
  await prisma.consultantCompany.upsert({
    where: { consultantId_companyId: { consultantId: consultant.id, companyId: company.id } },
    update: {},
    create: {
      consultantId: consultant.id,
      companyId: company.id,
      role: "ADMIN",
    },
  });
  console.log("✅ Consultant:", consultant.email);

  // User ADMIN demo — upsert por id para evitar conflito ao trocar hash
  const adminCpfHash = hashCpf("00000000000");
  const adminPinHash = await bcrypt.hash("123456", 12);
  const admin = await prisma.user.upsert({
    where: { id: "user-admin-demo" },
    update: { cpfHash: adminCpfHash, pin: adminPinHash },
    create: {
      id: "user-admin-demo",
      name: "Admin Demo",
      email: "admin@demo.com",
      cpfHash: adminCpfHash,
      pin: adminPinHash,
      role: "ADMIN",
      sector: "RH",
      jobTitle: "Gestor de RH",
      companyId: company.id,
    },
  });
  console.log("✅ Admin user — CPF: 000.000.000-00 | PIN: 123456");

  // User EMPLOYEE demo
  const empCpfHash = hashCpf("11111111111");
  const empPinHash = await bcrypt.hash("654321", 12);
  await prisma.user.upsert({
    where: { id: "user-emp-demo" },
    update: { cpfHash: empCpfHash, pin: empPinHash },
    create: {
      id: "user-emp-demo",
      name: "Funcionário Demo",
      cpfHash: empCpfHash,
      pin: empPinHash,
      role: "EMPLOYEE",
      sector: "Tecnologia",
      jobTitle: "Desenvolvedor",
      companyId: company.id,
    },
  });
  console.log("✅ Employee user — CPF: 111.111.111-11 | PIN: 654321");

  // Campaign demo
  const campaign = await prisma.campaign.upsert({
    where: { slug: "avaliacao-drps-2025" },
    update: {},
    create: {
      id: "campaign-demo",
      title: "Avaliação DRPS 2025",
      slug: "avaliacao-drps-2025",
      description: "Diagnóstico de Riscos Psicossociais — NR-01",
      status: "ACTIVE",
      companyId: company.id,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
    },
  });
  console.log("✅ Campaign:", campaign.title, "| Link: /r/" + campaign.slug);
  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("   Acesse: http://localhost:3000");
  console.log("   Login admin: CPF 000.000.000-00 | PIN 123456");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

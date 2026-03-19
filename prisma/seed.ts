import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function hashCpf(cpf: string) {
  const secret = process.env.CPF_HMAC_SECRET;
  if (!secret) throw new Error("CPF_HMAC_SECRET não definida no .env");
  return crypto.createHmac("sha256", secret).update(cpf.replace(/\D/g, "")).digest("hex");
}

const demoCompanies = [
  {
    company: {
      id: "company-demo",
      name: "Empresa Demo Ltda",
      cnpj: "00.000.000/0001-00",
      slug: "demo-empresa",
    },
    admin: {
      id: "user-admin-demo",
      name: "Admin Demo",
      email: "admin@demo.com",
      cpf: "00000000000",
      pin: "123456",
      sector: "RH",
      jobTitle: "Gestor de RH",
    },
    employee: {
      id: "user-emp-demo",
      name: "Funcionário Demo",
      cpf: "11111111111",
      pin: "654321",
      sector: "Tecnologia",
      jobTitle: "Desenvolvedor",
    },
    campaign: {
      id: "campaign-demo",
      title: "Avaliação DRPS 2025",
      slug: "avaliacao-drps-2025",
      description: "Diagnóstico de Riscos Psicossociais — NR-01",
      status: "ACTIVE" as const,
    },
  },
  {
    company: {
      id: "company-industria-demo",
      name: "Indústria Horizonte S.A.",
      cnpj: "11.111.111/0001-11",
      slug: "industria-horizonte",
    },
    admin: {
      id: "user-admin-industria-demo",
      name: "Paula Gestão",
      email: "paula@horizonte.com",
      cpf: "22222222222",
      pin: "123456",
      sector: "Recursos Humanos",
      jobTitle: "Coordenadora de Pessoas",
    },
    employee: {
      id: "user-emp-industria-demo",
      name: "Carlos Produção",
      cpf: "33333333333",
      pin: "654321",
      sector: "Produção",
      jobTitle: "Operador",
    },
    campaign: {
      id: "campaign-industria-demo",
      title: "Levantamento Psicossocial Produção",
      slug: "levantamento-horizonte-2025",
      description: "Campanha piloto do tenant indústria",
      status: "ACTIVE" as const,
    },
  },
  {
    company: {
      id: "company-clinica-demo",
      name: "Clínica Aurora Ocupacional",
      cnpj: "22.222.222/0001-22",
      slug: "clinica-aurora",
    },
    admin: {
      id: "user-admin-clinica-demo",
      name: "Marina RH",
      email: "marina@aurora.com",
      cpf: "44444444444",
      pin: "123456",
      sector: "Administrativo",
      jobTitle: "Gerente Administrativa",
    },
    employee: {
      id: "user-emp-clinica-demo",
      name: "Lucas Comercial",
      cpf: "55555555555",
      pin: "654321",
      sector: "Comercial",
      jobTitle: "Executivo de Contas",
    },
    campaign: {
      id: "campaign-clinica-demo",
      title: "Pulso de clima e riscos 2025",
      slug: "pulso-aurora-2025",
      description: "Campanha inicial do tenant clínica",
      status: "DRAFT" as const,
    },
  },
];

async function seedCompany(item: (typeof demoCompanies)[number], consultantId: string) {
  const company = await prisma.company.upsert({
    where: { slug: item.company.slug },
    update: {
      name: item.company.name,
      cnpj: item.company.cnpj,
    },
    create: item.company,
  });
  console.log("✅ Company:", company.name);

  await prisma.consultantCompany.upsert({
    where: { consultantId_companyId: { consultantId, companyId: company.id } },
    update: { role: "ADMIN" },
    create: {
      consultantId,
      companyId: company.id,
      role: "ADMIN",
    },
  });

  const adminPinHash = await bcrypt.hash(item.admin.pin, 12);
  await prisma.user.upsert({
    where: { id: item.admin.id },
    update: {
      cpfHash: hashCpf(item.admin.cpf),
      pin: adminPinHash,
      companyId: company.id,
      sector: item.admin.sector,
      jobTitle: item.admin.jobTitle,
      email: item.admin.email,
    },
    create: {
      id: item.admin.id,
      name: item.admin.name,
      email: item.admin.email,
      cpfHash: hashCpf(item.admin.cpf),
      pin: adminPinHash,
      role: "ADMIN",
      sector: item.admin.sector,
      jobTitle: item.admin.jobTitle,
      companyId: company.id,
    },
  });

  const employeePinHash = await bcrypt.hash(item.employee.pin, 12);
  await prisma.user.upsert({
    where: { id: item.employee.id },
    update: {
      cpfHash: hashCpf(item.employee.cpf),
      pin: employeePinHash,
      companyId: company.id,
      sector: item.employee.sector,
      jobTitle: item.employee.jobTitle,
    },
    create: {
      id: item.employee.id,
      name: item.employee.name,
      cpfHash: hashCpf(item.employee.cpf),
      pin: employeePinHash,
      role: "EMPLOYEE",
      sector: item.employee.sector,
      jobTitle: item.employee.jobTitle,
      companyId: company.id,
    },
  });

  const campaign = await prisma.campaign.upsert({
    where: { slug: item.campaign.slug },
    update: {
      title: item.campaign.title,
      description: item.campaign.description,
      status: item.campaign.status,
      companyId: company.id,
    },
    create: {
      id: item.campaign.id,
      title: item.campaign.title,
      slug: item.campaign.slug,
      description: item.campaign.description,
      status: item.campaign.status,
      companyId: company.id,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
    },
  });

  console.log("✅ Campaign:", campaign.title, "| Link: /r/" + campaign.slug);
}

async function main() {
  const consultantPwHash = await bcrypt.hash("consultor123", 12);
  const consultant = await prisma.consultant.upsert({
    where: { email: "consultor@alllives.com.br" },
    update: {},
    create: {
      id: "consultant-demo",
      name: "Consultor All Lives",
      email: "consultor@alllives.com.br",
      password: consultantPwHash,
      globalRole: "OWNER",
    },
  });
  console.log("✅ Consultant:", consultant.email);

  const operationsConsultant = await prisma.consultant.upsert({
    where: { email: "operacoes@alllives.com.br" },
    update: {},
    create: {
      id: "consultant-operations-demo",
      name: "Consultor Operações",
      email: "operacoes@alllives.com.br",
      password: consultantPwHash,
      globalRole: "CONSULTANT",
    },
  });

  const analystConsultant = await prisma.consultant.upsert({
    where: { email: "analyst@alllives.com.br" },
    update: {},
    create: {
      id: "consultant-analyst-demo",
      name: "Analista All Lives",
      email: "analyst@alllives.com.br",
      password: consultantPwHash,
      globalRole: "ANALYST",
    },
  });

  for (const item of demoCompanies) {
    await seedCompany(item, consultant.id);
  }

  await prisma.consultantCompany.upsert({
    where: {
      consultantId_companyId: {
        consultantId: operationsConsultant.id,
        companyId: "company-demo",
      },
    },
    update: { role: "ADMIN" },
    create: {
      consultantId: operationsConsultant.id,
      companyId: "company-demo",
      role: "ADMIN",
    },
  });

  await prisma.consultantCompany.upsert({
    where: {
      consultantId_companyId: {
        consultantId: analystConsultant.id,
        companyId: "company-industria-demo",
      },
    },
    update: { role: "VIEWER" },
    create: {
      consultantId: analystConsultant.id,
      companyId: "company-industria-demo",
      role: "VIEWER",
    },
  });

  console.log("✅ Admin demo principal — CPF: 000.000.000-00 | PIN: 123456");
  console.log("✅ Employee demo principal — CPF: 111.111.111-11 | PIN: 654321");
  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("   Acesse: http://localhost:3000");
  console.log("   Login consultor: consultor@alllives.com.br | Senha: consultor123");
  console.log("   Login consultor operacional: operacoes@alllives.com.br | Senha: consultor123");
  console.log("   Login analista: analyst@alllives.com.br | Senha: consultor123");
  console.log("   Login admin principal: CPF 000.000.000-00 | PIN 123456");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

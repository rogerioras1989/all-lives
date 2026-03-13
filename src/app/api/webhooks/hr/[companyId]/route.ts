import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type EmployeePayload = {
  name: string;
  email?: string;
  sector?: string;
  jobTitle?: string;
  cpf?: string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) return NextResponse.json({ error: "API key obrigatória" }, { status: 401 });

    const integration = await prisma.hrIntegration.findUnique({ where: { companyId } });
    if (!integration || integration.apiKey !== apiKey) {
      return NextResponse.json({ error: "API key inválida" }, { status: 401 });
    }

    const body = await req.json();
    const employees: EmployeePayload[] = Array.isArray(body) ? body : body.employees;
    if (!Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json({ error: "Payload deve ser array de funcionários" }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const emp of employees) {
      if (!emp.name) { errors.push(`Funcionário sem nome ignorado`); continue; }

      try {
        if (emp.email) {
          const existing = await prisma.user.findUnique({ where: { email: emp.email } });
          if (existing) {
            await prisma.user.update({
              where: { email: emp.email },
              data: {
                name: emp.name,
                sector: emp.sector,
                jobTitle: emp.jobTitle,
                companyId,
              },
            });
            updated++;
          } else {
            await prisma.user.create({
              data: {
                name: emp.name,
                email: emp.email,
                sector: emp.sector,
                jobTitle: emp.jobTitle,
                companyId,
                role: "EMPLOYEE",
                pin: await bcrypt.hash("0000", 12),
              },
            });
            created++;
          }
        }
      } catch {
        errors.push(`Erro ao processar ${emp.name}`);
      }
    }

    await prisma.hrIntegration.update({
      where: { companyId },
      data: {
        lastSyncAt: new Date(),
        syncLog: { created, updated, errors, total: employees.length, syncedAt: new Date().toISOString() },
      },
    });

    return NextResponse.json({ created, updated, errors, total: employees.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

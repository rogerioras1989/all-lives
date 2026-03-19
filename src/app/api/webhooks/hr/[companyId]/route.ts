import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createHash, randomInt } from "crypto";
import { hashCpf } from "@/lib/auth";

type EmployeePayload = {
  name: string;
  email?: string;
  sector?: string;
  jobTitle?: string;
  cpf?: string;
};

const MAX_EMPLOYEES_PER_SYNC = 1000;

function hashIntegrationKey(rawKey: string) {
  return createHash("sha256").update(rawKey).digest("hex");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) return NextResponse.json({ error: "API key obrigatória" }, { status: 401 });

    const integration = await prisma.hrIntegration.findUnique({ where: { companyId } });
    if (!integration || (integration.apiKey !== hashIntegrationKey(apiKey) && integration.apiKey !== apiKey)) {
      return NextResponse.json({ error: "API key inválida" }, { status: 401 });
    }

    const body = await req.json();
    const employees: EmployeePayload[] = Array.isArray(body) ? body : body.employees;
    if (!Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json({ error: "Payload deve ser array de funcionários" }, { status: 400 });
    }
    if (employees.length > MAX_EMPLOYEES_PER_SYNC) {
      return NextResponse.json({ error: `Payload excede o limite de ${MAX_EMPLOYEES_PER_SYNC} funcionários por sincronização` }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const emp of employees) {
      if (!emp.name) { errors.push(`Funcionário sem nome ignorado`); continue; }

      try {
        const normalizedEmail = emp.email?.trim().toLowerCase();
        const cpfHash = emp.cpf ? hashCpf(emp.cpf) : undefined;
        if (!normalizedEmail && !cpfHash) {
          errors.push(`Funcionário ${emp.name} sem identificador único (email/cpf)`);
          continue;
        }

        const existing = cpfHash
          ? await prisma.user.findFirst({
              where: {
                OR: [
                  { cpfHash },
                  ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
                ],
              },
            })
          : await prisma.user.findUnique({ where: { email: normalizedEmail } });

        if (existing) {
          if (existing.companyId && existing.companyId !== companyId) {
            errors.push(`Conflito de identidade para ${emp.name}: usuário já pertence a outro tenant`);
            continue;
          }

          await prisma.user.update({
            where: { id: existing.id },
            data: {
              name: emp.name,
              email: normalizedEmail,
              cpfHash: cpfHash ?? existing.cpfHash,
              sector: emp.sector,
              jobTitle: emp.jobTitle,
              companyId,
            },
          });
          updated++;
        } else {
          const rawPin = String(randomInt(100000, 999999));
          await prisma.user.create({
            data: {
              name: emp.name,
              email: normalizedEmail,
              cpfHash,
              sector: emp.sector,
              jobTitle: emp.jobTitle,
              companyId,
              role: "EMPLOYEE",
              pin: await bcrypt.hash(rawPin, 12),
            },
          });
          created++;
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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashCpf, hashPin } from "@/lib/auth";

// Registro de funcionário (pode ser protegido por admin em produção)
export async function POST(req: NextRequest) {
  try {
    const { cpf, pin, name, email, sector, jobTitle, companyId } = await req.json();

    if (!cpf || !pin) {
      return NextResponse.json({ error: "CPF e PIN obrigatórios" }, { status: 400 });
    }
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: "PIN deve ter 6 dígitos" }, { status: 400 });
    }

    const cpfHash = hashCpf(cpf);
    const existing = await prisma.user.findUnique({ where: { cpfHash } });
    if (existing) {
      return NextResponse.json({ error: "CPF já cadastrado" }, { status: 409 });
    }

    const pinHash = await hashPin(pin);
    const user = await prisma.user.create({
      data: {
        cpfHash,
        pin: pinHash,
        name,
        email,
        sector,
        jobTitle,
        companyId,
        role: "EMPLOYEE",
      },
    });

    return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
  } catch (err) {
    console.error("[register]", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

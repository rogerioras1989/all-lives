import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashCpf, hashPin } from "@/lib/auth";
import {
  getTenantContext,
  requireTenantManagement,
  tenantError,
} from "@/lib/tenant";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    requireTenantManagement(ctx);
    const body = await req.json();
    // B-3: trim em todos os campos de texto para evitar dados inconsistentes
    const cpf = typeof body.cpf === "string" ? body.cpf.trim() : body.cpf;
    const pin = typeof body.pin === "string" ? body.pin.trim() : body.pin;
    const name = typeof body.name === "string" ? body.name.trim() || undefined : body.name;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() || undefined : body.email;
    const sector = typeof body.sector === "string" ? body.sector.trim() || undefined : body.sector;
    const jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim() || undefined : body.jobTitle;
    if (!cpf || !pin) {
      return NextResponse.json({ error: "CPF e PIN obrigatórios" }, { status: 400 });
    }
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: "PIN deve ter 6 dígitos" }, { status: 400 });
    }

    const companyId = ctx.companyId;
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
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
    const { error, status } = tenantError(err);
    if (status !== 500) return NextResponse.json({ error }, { status });
    console.error("[register]", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

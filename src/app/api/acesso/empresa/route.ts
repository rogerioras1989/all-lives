import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAccessToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { slug, password } = await req.json();

  if (!slug || !password) {
    return NextResponse.json({ error: "Código e senha obrigatórios." }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { slug: slug.trim().toLowerCase() },
    select: { id: true, name: true, adminPasswordHash: true },
  });

  if (!company || !company.adminPasswordHash) {
    return NextResponse.json({ error: "Empresa não encontrada ou acesso não configurado." }, { status: 404 });
  }

  const valid = await bcrypt.compare(password, company.adminPasswordHash);
  if (!valid) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  // JWT usando companyId como sub, role HR, type "user" — compatível com o tenant system
  const token = signAccessToken({
    sub: company.id,
    role: "HR",
    companyId: company.id,
    type: "user",
  });

  const res = NextResponse.json({ ok: true, companyName: company.name });
  res.cookies.set("access_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("access_token", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}

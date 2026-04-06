import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAccessToken } from "@/lib/auth";

// BUG-5: rate limiting para brute force
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS = 10;
const attemptStore = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = attemptStore.get(key);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    attemptStore.set(key, { count: 1, windowStart: now });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_ATTEMPTS;
}

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

// BUG-9: TTL da sessão alinhado para cookie e JWT (8 horas)
const COMPANY_SESSION_TTL = "8h";
const COMPANY_SESSION_SECONDS = 8 * 60 * 60;

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  // BUG-5: verificar rate limit por IP
  if (!checkRateLimit(`company_login:${ip}`)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });
  }

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

  // BUG-3: usar type "company" para diferenciar do login de usuário
  // BUG-9: usar TTL de 8h tanto no JWT quanto no cookie
  const token = signAccessToken({
    sub: company.id,
    role: "HR",
    companyId: company.id,
    type: "company",
  }, COMPANY_SESSION_TTL);

  // BUG-23: registrar audit log do login
  await prisma.auditLog.create({
    data: {
      companyId: company.id,
      action: "COMPANY_LOGIN",
      entityType: "Company",
      entityId: company.id,
      performedBy: company.id,
      performedByType: "User",
      metadata: { ip },
    },
  }).catch(() => {}); // não bloquear login por falha no audit

  const res = NextResponse.json({ ok: true, companyName: company.name });
  // BUG-6: flag secure em produção; BUG-9: maxAge alinhado com JWT TTL
  res.cookies.set("access_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COMPANY_SESSION_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

export async function DELETE(req: NextRequest) {
  const payload = req.cookies.get("access_token");
  const res = NextResponse.json({ ok: true });
  res.cookies.set("access_token", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });

  // Registrar logout se tiver companyId disponível no cookie (best-effort)
  if (payload) {
    try {
      const { verifyAccessToken } = await import("@/lib/auth");
      const decoded = verifyAccessToken(payload.value);
      if (decoded.type === "company" && decoded.companyId) {
        await prisma.auditLog.create({
          data: {
            companyId: decoded.companyId,
            action: "COMPANY_LOGOUT",
            entityType: "Company",
            entityId: decoded.companyId,
            performedBy: decoded.companyId,
            performedByType: "User",
            metadata: {},
          },
        });
      }
    } catch {}
  }

  return res;
}

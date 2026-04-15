import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  signAccessToken, signRefreshToken, hashRefreshToken,
  verifyTotp,
} from "@/lib/auth";
import {
  consumeAuthRateLimit,
  resetAuthRateLimit,
} from "@/lib/auth-rate-limit";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const AUTH_RATE_LIMIT_MAX = 20;
const AUTH_RATE_LIMIT_WINDOW_MS = 60_000;

// C-1: dummy hash para evitar timing attack quando email não existe
// Gerado com bcrypt cost 12; nunca corresponde a nenhuma senha real
const DUMMY_PASSWORD_HASH = "$2a$12$KIXdummyhashfortimingneutrality0000000000000000000000";

function isSecure(req: NextRequest): boolean {
  return req.headers.get("x-forwarded-proto") === "https" ||
    req.nextUrl.protocol === "https:";
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, totpToken } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha obrigatórios" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const rateLimit = await consumeAuthRateLimit({
      req,
      scope: "consultant_login",
      subject: normalizedEmail,
      maxAttempts: AUTH_RATE_LIMIT_MAX,
      windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
      blockMs: LOCK_MINUTES * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Muitas tentativas. Tente novamente em ${Math.ceil(rateLimit.retryAfterSeconds / 60)} min.` },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const consultant = await prisma.consultant.findUnique({ where: { email: normalizedEmail } });

    // C-1: sempre executar bcrypt mesmo quando consultant não existe (evita timing attack)
    const hashToVerify = consultant?.password ?? DUMMY_PASSWORD_HASH;
    const ok = await bcrypt.compare(password, hashToVerify);

    if (!consultant) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    // Check account lock
    if (consultant.lockedUntil && consultant.lockedUntil > new Date()) {
      const minutes = Math.ceil((consultant.lockedUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Conta bloqueada. Tente novamente em ${minutes} min.` },
        { status: 429 }
      );
    }

    if (!ok) {
      // C-2: operação atômica — increment + lock condicional na mesma transação
      const lockAt = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      await prisma.$transaction([
        prisma.consultant.update({
          where: { id: consultant.id },
          data: { failedAttempts: { increment: 1 } },
        }),
        prisma.consultant.updateMany({
          where: { id: consultant.id, failedAttempts: { gte: MAX_ATTEMPTS }, lockedUntil: null },
          data: { lockedUntil: lockAt },
        }),
      ]);
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    // TOTP check if enabled
    if (consultant.totpEnabled) {
      if (!totpToken) {
        return NextResponse.json({ requireTotp: true }, { status: 200 });
      }
      const totpOk = verifyTotp(totpToken, consultant.totpSecret!);
      if (!totpOk) {
        // C-2: mesmo padrão atômico para falha TOTP
        const lockAt = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        await prisma.$transaction([
          prisma.consultant.update({
            where: { id: consultant.id },
            data: { failedAttempts: { increment: 1 } },
          }),
          prisma.consultant.updateMany({
            where: { id: consultant.id, failedAttempts: { gte: MAX_ATTEMPTS }, lockedUntil: null },
            data: { lockedUntil: lockAt },
          }),
        ]);
        return NextResponse.json({ error: "Código TOTP inválido" }, { status: 401 });
      }
    }

    const accessToken = signAccessToken({
      sub: consultant.id,
      role: consultant.globalRole,
      type: "consultant",
    });
    const refreshToken = signRefreshToken({ sub: consultant.id, type: "consultant" });
    const refreshHash = await hashRefreshToken(refreshToken); // fix #5

    await prisma.consultant.update({
      where: { id: consultant.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        refreshTokenHash: refreshHash, // fix #5 — store hash
      },
    });
    await resetAuthRateLimit(req, "consultant_login", normalizedEmail);

    const secure = isSecure(req); // fix #14

    const res = NextResponse.json({
      ok: true,
      consultant: { id: consultant.id, name: consultant.name, email: consultant.email, globalRole: consultant.globalRole },
    });

    res.cookies.set("access_token", accessToken, {
      httpOnly: true, secure, sameSite: "lax", maxAge: 15 * 60,
    });
    res.cookies.set("refresh_token", refreshToken, {
      httpOnly: true, secure, sameSite: "lax", maxAge: 7 * 24 * 60 * 60, path: "/api/auth/refresh",
    });

    return res;
  } catch (err) {
    console.error("[consultor/login]", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

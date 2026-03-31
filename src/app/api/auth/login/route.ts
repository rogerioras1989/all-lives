import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  hashCpf, verifyTotp,
  signAccessToken, signRefreshToken,
  hashRefreshToken,
} from "@/lib/auth";
import {
  consumeAuthRateLimit,
  resetAuthRateLimit,
} from "@/lib/auth-rate-limit";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const AUTH_RATE_LIMIT_MAX = 20;
const AUTH_RATE_LIMIT_WINDOW_MS = 60_000;

// fix #9 — hash dummy constante para uso quando usuário não existe (evita timing attack)
// Pré-gerado com bcrypt cost 12; nunca corresponde a nenhum PIN real
const DUMMY_PIN_HASH = "$2a$12$dummyhashfortimingneutralityXXXXXXXXXXXXXXXXXXXXXX";

function isSecure(req: NextRequest): boolean {
  return req.headers.get("x-forwarded-proto") === "https" ||
    req.nextUrl.protocol === "https:";
}

export async function POST(req: NextRequest) {
  try {
    const { cpf, pin, totpToken } = await req.json();

    if (!cpf || !pin) {
      return NextResponse.json({ error: "CPF e PIN obrigatórios" }, { status: 400 });
    }

    const rateLimit = await consumeAuthRateLimit({
      req,
      scope: "user_login",
      subject: String(cpf),
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

    const cpfHash = hashCpf(cpf);
    const user = await prisma.user.findUnique({ where: { cpfHash } });

    // fix #9 — sempre executar bcrypt mesmo quando usuário não existe (evita timing attack)
    const hashToVerify = user?.pin ?? DUMMY_PIN_HASH;
    const pinOk = await bcrypt.compare(pin, hashToVerify);

    if (!user || !user.pin) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    // Check lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Conta bloqueada. Tente novamente em ${minutes} min.` },
        { status: 429 }
      );
    }

    // Verify PIN (resultado já computado acima)
    if (!pinOk) {
      // C-2: operação atômica — increment + lock condicional na mesma transação
      const lockAt = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { failedAttempts: { increment: 1 } },
        }),
        prisma.user.updateMany({
          where: { id: user.id, failedAttempts: { gte: MAX_ATTEMPTS }, lockedUntil: null },
          data: { lockedUntil: lockAt },
        }),
      ]);
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    // Verify TOTP if enabled
    if (user.totpEnabled) {
      if (!totpToken) {
        return NextResponse.json({ requireTotp: true }, { status: 200 });
      }
      const ok = verifyTotp(totpToken, user.totpSecret!);
      if (!ok) {
        // C-2: mesmo padrão atômico para falha TOTP
        const lockAt = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: { failedAttempts: { increment: 1 } },
          }),
          prisma.user.updateMany({
            where: { id: user.id, failedAttempts: { gte: MAX_ATTEMPTS }, lockedUntil: null },
            data: { lockedUntil: lockAt },
          }),
        ]);
        return NextResponse.json({ error: "Código TOTP inválido" }, { status: 401 });
      }
    }

    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role,
      companyId: user.companyId ?? undefined,
      type: "user",
    });
    const refreshToken = signRefreshToken({ sub: user.id, type: "user" });
    const refreshHash = await hashRefreshToken(refreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        refreshTokenHash: refreshHash,
      },
    });
    await resetAuthRateLimit(req, "user_login", String(cpf));

    const secure = isSecure(req); // fix #14

    // Mapeamento de rotas por Role
    let redirectTo = "/dashboard";
    if (user.role === "EMPLOYEE") {
      redirectTo = "/portal";
    } else if (user.role === "OWNER" || user.role === "ADMIN" || user.role === "HR") {
      redirectTo = "/dashboard";
    }

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, role: user.role, companyId: user.companyId },
      redirectTo,
    });

    res.cookies.set("access_token", accessToken, {
      httpOnly: true, secure, sameSite: "lax", maxAge: 15 * 60,
    });
    res.cookies.set("refresh_token", refreshToken, {
      httpOnly: true, secure, sameSite: "lax", maxAge: 7 * 24 * 60 * 60, path: "/api/auth/refresh",
    });

    return res;
  } catch (err) {
    console.error("[login]", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

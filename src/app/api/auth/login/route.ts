import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashCpf, verifyPin, verifyTotp,
  signAccessToken, signRefreshToken,
  hashRefreshToken,
} from "@/lib/auth";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

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

    const cpfHash = hashCpf(cpf);
    const user = await prisma.user.findUnique({ where: { cpfHash } });

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

    // Verify PIN
    const pinOk = await verifyPin(pin, user.pin);
    if (!pinOk) {
      // fix #4 — atomic increment to avoid race condition
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: { increment: 1 },
        },
        select: { failedAttempts: true },
      });
      if (updated.failedAttempts >= MAX_ATTEMPTS) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000) },
        });
      }
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    // Verify TOTP if enabled
    if (user.totpEnabled) {
      if (!totpToken) {
        return NextResponse.json({ requireTotp: true }, { status: 200 });
      }
      const ok = verifyTotp(totpToken, user.totpSecret!);
      if (!ok) {
        // fix #6 — count TOTP failures too
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: { failedAttempts: { increment: 1 } },
          select: { failedAttempts: true },
        });
        if (updated.failedAttempts >= MAX_ATTEMPTS) {
          await prisma.user.update({
            where: { id: user.id },
            data: { lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000) },
          });
        }
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

    const secure = isSecure(req); // fix #14

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, role: user.role, companyId: user.companyId },
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

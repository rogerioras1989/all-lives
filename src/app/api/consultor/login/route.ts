import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  signAccessToken, signRefreshToken, hashRefreshToken,
  verifyTotp,
} from "@/lib/auth";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

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

    const consultant = await prisma.consultant.findUnique({ where: { email } });
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

    const ok = await bcrypt.compare(password, consultant.password);
    if (!ok) {
      // fix #4-equivalent for consultant — atomic increment
      const updated = await prisma.consultant.update({
        where: { id: consultant.id },
        data: { failedAttempts: { increment: 1 } },
        select: { failedAttempts: true },
      });
      if (updated.failedAttempts >= MAX_ATTEMPTS) {
        await prisma.consultant.update({
          where: { id: consultant.id },
          data: { lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000) },
        });
      }
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    // TOTP check if enabled
    if (consultant.totpEnabled) {
      if (!totpToken) {
        return NextResponse.json({ requireTotp: true }, { status: 200 });
      }
      const totpOk = verifyTotp(totpToken, consultant.totpSecret!);
      if (!totpOk) {
        const updated = await prisma.consultant.update({
          where: { id: consultant.id },
          data: { failedAttempts: { increment: 1 } },
          select: { failedAttempts: true },
        });
        if (updated.failedAttempts >= MAX_ATTEMPTS) {
          await prisma.consultant.update({
            where: { id: consultant.id },
            data: { lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000) },
          });
        }
        return NextResponse.json({ error: "Código TOTP inválido" }, { status: 401 });
      }
    }

    const accessToken = signAccessToken({
      sub: consultant.id,
      role: "CONSULTANT",
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

    const secure = isSecure(req); // fix #14

    const res = NextResponse.json({
      ok: true,
      consultant: { id: consultant.id, name: consultant.name, email: consultant.email },
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

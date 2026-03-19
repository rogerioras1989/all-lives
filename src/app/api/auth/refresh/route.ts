import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyRefreshToken, verifyRefreshTokenHash,
  signAccessToken, signRefreshToken, hashRefreshToken,
} from "@/lib/auth";
import {
  consumeAuthRateLimit,
  resetAuthRateLimit,
} from "@/lib/auth-rate-limit";

const REFRESH_RATE_LIMIT_MAX = 20;
const REFRESH_RATE_LIMIT_WINDOW_MS = 60_000;
const REFRESH_RATE_LIMIT_BLOCK_MS = 5 * 60 * 1000;

function isSecure(req: NextRequest): boolean {
  return req.headers.get("x-forwarded-proto") === "https" ||
    req.nextUrl.protocol === "https:";
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await consumeAuthRateLimit({
      req,
      scope: "token_refresh",
      maxAttempts: REFRESH_RATE_LIMIT_MAX,
      windowMs: REFRESH_RATE_LIMIT_WINDOW_MS,
      blockMs: REFRESH_RATE_LIMIT_BLOCK_MS,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas de refresh. Tente novamente em alguns minutos." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const token = req.cookies.get("refresh_token")?.value;
    if (!token) return NextResponse.json({ error: "No token" }, { status: 401 });

    const payload = verifyRefreshToken(token);
    const secure = isSecure(req); // fix #14

    if (payload.type === "consultant") {
      const consultant = await prisma.consultant.findUnique({ where: { id: payload.sub } });
      if (!consultant?.refreshTokenHash) return NextResponse.json({ error: "Invalid" }, { status: 401 });

      const valid = await verifyRefreshTokenHash(token, consultant.refreshTokenHash);
      if (!valid) return NextResponse.json({ error: "Invalid" }, { status: 401 });

      const accessToken = signAccessToken({
        sub: consultant.id, role: consultant.globalRole, type: "consultant",
      });
      const newRefresh = signRefreshToken({ sub: consultant.id, type: "consultant" });
      await prisma.consultant.update({
        where: { id: consultant.id },
        data: { refreshTokenHash: await hashRefreshToken(newRefresh) },
      });

      const res = NextResponse.json({ ok: true });
      res.cookies.set("access_token", accessToken, {
        httpOnly: true, secure, sameSite: "lax", maxAge: 15 * 60,
      });
      res.cookies.set("refresh_token", newRefresh, {
        httpOnly: true, secure, sameSite: "lax", maxAge: 7 * 24 * 60 * 60, path: "/api/auth/refresh",
      });
      await resetAuthRateLimit(req, "token_refresh");
      return res;
    }

    // user
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.refreshTokenHash) return NextResponse.json({ error: "Invalid" }, { status: 401 });

    const valid = await verifyRefreshTokenHash(token, user.refreshTokenHash);
    if (!valid) return NextResponse.json({ error: "Invalid" }, { status: 401 });

    const accessToken = signAccessToken({
      sub: user.id, role: user.role,
      companyId: user.companyId ?? undefined, type: "user",
    });
    const newRefresh = signRefreshToken({ sub: user.id, type: "user" });
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: await hashRefreshToken(newRefresh) },
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set("access_token", accessToken, {
      httpOnly: true, secure, sameSite: "lax", maxAge: 15 * 60,
    });
    res.cookies.set("refresh_token", newRefresh, {
      httpOnly: true, secure, sameSite: "lax", maxAge: 7 * 24 * 60 * 60, path: "/api/auth/refresh",
    });
    await resetAuthRateLimit(req, "token_refresh");
    return res;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

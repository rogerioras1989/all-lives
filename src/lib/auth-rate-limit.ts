import { createHmac } from "crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

type AuthRateLimitScope = "user_login" | "consultant_login" | "token_refresh";

type ConsumeAuthRateLimitInput = {
  req: NextRequest;
  scope: AuthRateLimitScope;
  subject?: string;
  maxAttempts: number;
  windowMs: number;
  blockMs?: number;
};

type AuthRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const RATE_LIMIT_SECRET = process.env.AUTH_RATE_LIMIT_SECRET ?? process.env.JWT_SECRET ?? "";

if (!RATE_LIMIT_SECRET) {
  throw new Error("[auth-rate-limit] AUTH_RATE_LIMIT_SECRET ou JWT_SECRET deve ser configurado.");
}

function hashBucketKey(scope: AuthRateLimitScope, rawKey: string) {
  return createHmac("sha256", RATE_LIMIT_SECRET)
    .update(`${scope}:${rawKey}`)
    .digest("hex");
}

export function getRequestIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function getBucketKey(req: NextRequest, scope: AuthRateLimitScope, subject?: string) {
  const ip = getRequestIp(req);
  return hashBucketKey(scope, `${ip}|${subject?.trim().toLowerCase() ?? "*"}`);
}

function getRetryAfterSeconds(blockedUntil: Date) {
  return Math.max(1, Math.ceil((blockedUntil.getTime() - Date.now()) / 1000));
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function consumeAuthRateLimit({
  req,
  scope,
  subject,
  maxAttempts,
  windowMs,
  blockMs = windowMs,
}: ConsumeAuthRateLimitInput, retryCount = 0): Promise<AuthRateLimitResult> {
  const bucketKey = getBucketKey(req, scope, subject);
  const now = new Date();
  const existing = await prisma.authRateLimit.findUnique({
    where: { scope_bucketKey: { scope, bucketKey } },
  });

  if (!existing) {
    try {
      await prisma.authRateLimit.create({
        data: {
          scope,
          bucketKey,
          attempts: 1,
          windowStartedAt: now,
        },
      });
    } catch (error) {
      if (retryCount < 1 && isUniqueConstraintError(error)) {
        return consumeAuthRateLimit(
          { req, scope, subject, maxAttempts, windowMs, blockMs },
          retryCount + 1
        );
      }
      throw error;
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.blockedUntil && existing.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: getRetryAfterSeconds(existing.blockedUntil),
    };
  }

  if (now.getTime() - existing.windowStartedAt.getTime() >= windowMs) {
    await prisma.authRateLimit.update({
      where: { id: existing.id },
      data: {
        attempts: 1,
        windowStartedAt: now,
        blockedUntil: null,
      },
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const nextAttempts = existing.attempts + 1;
  const blockedUntil = nextAttempts > maxAttempts
    ? new Date(now.getTime() + blockMs)
    : null;

  await prisma.authRateLimit.update({
    where: { id: existing.id },
    data: {
      attempts: nextAttempts,
      blockedUntil,
    },
  });

  if (blockedUntil) {
    return {
      allowed: false,
      retryAfterSeconds: getRetryAfterSeconds(blockedUntil),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function resetAuthRateLimit(
  req: NextRequest,
  scope: AuthRateLimitScope,
  subject?: string
) {
  const bucketKey = getBucketKey(req, scope, subject);
  await prisma.authRateLimit.deleteMany({
    where: { scope, bucketKey },
  });
}

import { createHmac } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

/**
 * Rate limiter genérico, persistido na tabela `AuthRateLimit`.
 *
 * Diferente de `auth-rate-limit.ts` (que é específico para fluxos de auth),
 * este helper aceita qualquer scope arbitrário, permitindo proteger endpoints
 * públicos como `/api/whistleblower`, `/api/contact` e `/api/responses` contra
 * flood/abuse.
 *
 * Exemplo de uso em uma rota:
 *
 * ```ts
 * const limit = await consumeRateLimit({
 *   req,
 *   scope: "whistleblower:create",
 *   maxAttempts: 5,
 *   windowMs: 60 * 60 * 1000,
 * });
 * if (!limit.allowed) return rateLimitResponse(limit);
 * ```
 */

type RateLimitInput = {
  req: NextRequest;
  /** Identificador do balde (ex.: "whistleblower:create"). Não precisa ser de auth. */
  scope: string;
  /** Identificador adicional opcional (ex.: companyId, campaignId, email). */
  subject?: string;
  /** Quantas tentativas são permitidas dentro da janela. */
  maxAttempts: number;
  /** Tamanho da janela em ms. */
  windowMs: number;
  /** Quanto tempo o bloqueio dura após exceder o limite. Default = windowMs. */
  blockMs?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const RATE_LIMIT_SECRET =
  process.env.AUTH_RATE_LIMIT_SECRET ?? process.env.JWT_SECRET ?? "";

if (!RATE_LIMIT_SECRET) {
  // Mantém paridade de segurança com auth-rate-limit: nunca rodar sem segredo.
  throw new Error(
    "[rate-limit] AUTH_RATE_LIMIT_SECRET ou JWT_SECRET deve ser configurado."
  );
}

function hashBucketKey(scope: string, rawKey: string) {
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

function getBucketKey(req: NextRequest, scope: string, subject?: string) {
  const ip = getRequestIp(req);
  return hashBucketKey(scope, `${ip}|${subject?.trim().toLowerCase() ?? "*"}`);
}

function getRetryAfterSeconds(blockedUntil: Date) {
  return Math.max(1, Math.ceil((blockedUntil.getTime() - Date.now()) / 1000));
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function consumeRateLimit(
  { req, scope, subject, maxAttempts, windowMs, blockMs = windowMs }: RateLimitInput,
  retryCount = 0
): Promise<RateLimitResult> {
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
        return consumeRateLimit(
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
  const blockedUntil =
    nextAttempts > maxAttempts ? new Date(now.getTime() + blockMs) : null;

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

export async function resetRateLimit(
  req: NextRequest,
  scope: string,
  subject?: string
) {
  const bucketKey = getBucketKey(req, scope, subject);
  await prisma.authRateLimit.deleteMany({
    where: { scope, bucketKey },
  });
}

/**
 * Resposta padrão para HTTP 429 com header `Retry-After` correto.
 */
export function rateLimitResponse(
  result: RateLimitResult,
  message = "Muitas requisições. Tente novamente em instantes."
) {
  return NextResponse.json(
    { error: message, retryAfterSeconds: result.retryAfterSeconds },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
    }
  );
}

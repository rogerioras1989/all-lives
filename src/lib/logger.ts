import pino from "pino";

/**
 * Logger estruturado central da aplicação.
 *
 * Substitui o uso de `console.log/error/info` espalhado nas rotas. Em produção
 * gera JSON em uma única linha (compatível com agregadores como Datadog,
 * Loki, Logtail, Papertrail). Em dev usa o pretty printer se disponível.
 *
 * Uso:
 *
 * ```ts
 * import { logger } from "@/lib/logger";
 * logger.info({ scope: "responses", campaignId }, "resposta criada");
 * logger.error({ scope: "responses", err }, "falha ao criar resposta");
 * ```
 *
 * Sentry/OpenTelemetry: este logger é agnóstico. Para integrar Sentry, basta
 * adicionar um transport ou um hook em `level === "error"`. Mantemos a
 * dependência opcional para não exigir DSN configurado em dev.
 */

const isProduction = process.env.NODE_ENV === "production";

const redactPaths = [
  "*.password",
  "*.passwordHash",
  "*.adminPasswordHash",
  "*.refreshTokenHash",
  "*.totpSecret",
  "*.cpf",
  "*.cpfHash",
  "*.pin",
  "*.apiKey",
  "*.token",
  "req.headers.authorization",
  "req.headers.cookie",
];

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  base: {
    app: "drps-all-lives",
    env: process.env.NODE_ENV ?? "development",
  },
  redact: {
    paths: redactPaths,
    censor: "[REDACTED]",
  },
  // Em produção, formato JSON puro (uma linha por evento) é o mais portável.
  // Em dev, pino-pretty é opcional — se não estiver instalado, cai pro JSON.
  ...(isProduction
    ? {}
    : {
        transport: undefined,
      }),
});

export type Logger = typeof logger;

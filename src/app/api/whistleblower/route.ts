import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import {
  consumeRateLimit,
  getRequestIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { encryptString } from "@/lib/encryption";
import { logger } from "@/lib/logger";

const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

// BUG-19: rate limiting por IP — agora persistido em DB via consumeRateLimit
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hora
const MAX_REPORTS_PER_WINDOW = 5;

function hashIp(ip: string): string {
  const secret = process.env.CPF_HMAC_SECRET ?? process.env.JWT_SECRET ?? "fallback";
  return crypto.createHmac("sha256", secret).update(ip).digest("hex");
}

// BUG-20: gerar protocolo com retry em caso de colisão
async function generateUniqueProtocol(maxAttempts = 5): Promise<string> {
  const year = new Date().getFullYear();
  for (let i = 0; i < maxAttempts; i++) {
    const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
    const protocol = `${year}-${rand.slice(0, 4)}-${rand.slice(4)}`;
    const existing = await prisma.whistleblowerReport.findUnique({ where: { protocol } });
    if (!existing) return protocol;
  }
  // fallback para UUID se todas as tentativas colidirem
  return `${new Date().getFullYear()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getRequestIp(req);
    const ipHash = hashIp(ip);

    // BUG-19: rate limiting — agora persistente entre instâncias
    const limit = await consumeRateLimit({
      req,
      scope: "whistleblower:create",
      maxAttempts: MAX_REPORTS_PER_WINDOW,
      windowMs: RATE_WINDOW_MS,
    });
    if (!limit.allowed) {
      return rateLimitResponse(
        limit,
        "Limite de denúncias atingido. Tente novamente mais tarde."
      );
    }

    const { companySlug, topic, description, priority } = await req.json();

    if (!companySlug || !topic || !description) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    if (typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json({ error: "Descrição obrigatória" }, { status: 400 });
    }

    // BUG-18: validar priority contra enum
    const safePriority = priority && VALID_PRIORITIES.includes(priority) ? priority : "MEDIUM";

    const company = await prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // BUG-20: protocolo único com retry
    const protocol = await generateUniqueProtocol();

    // Hardening: criptografar a descrição em repouso quando APP_ENCRYPTION_KEY existe.
    // Reduz o impacto de um leak do banco de dados em um canal sensível.
    const storedDescription = encryptString(description.trim());

    const report = await prisma.whistleblowerReport.create({
      data: {
        companyId: company.id,
        topic,
        description: storedDescription,
        priority: safePriority,
        protocol,
        status: "OPEN",
        ipHash, // BUG-19: preencher ipHash
      },
    });

    logger.info(
      { scope: "whistleblower", companyId: company.id, protocol: report.protocol },
      "denúncia criada"
    );

    return NextResponse.json({
      success: true,
      protocol: report.protocol,
      message: "Denúncia enviada com sucesso. Guarde seu protocolo para acompanhar.",
    });
  } catch (err) {
    logger.error({ scope: "whistleblower", err }, "erro ao criar denúncia");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

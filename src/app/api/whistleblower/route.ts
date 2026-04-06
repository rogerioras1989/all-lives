import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

// BUG-19: rate limiting por IP
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hora
const MAX_REPORTS_PER_WINDOW = 5;
const reportStore = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const entry = reportStore.get(ipHash);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    reportStore.set(ipHash, { count: 1, windowStart: now });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_REPORTS_PER_WINDOW;
}

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

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
    const ip = getIp(req);
    const ipHash = hashIp(ip);

    // BUG-19: rate limiting
    if (!checkRateLimit(ipHash)) {
      return NextResponse.json({ error: "Limite de denúncias atingido. Tente novamente mais tarde." }, { status: 429 });
    }

    const { companySlug, topic, description, priority } = await req.json();

    if (!companySlug || !topic || !description) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // BUG-18: validar priority contra enum
    const safePriority = priority && VALID_PRIORITIES.includes(priority) ? priority : "MEDIUM";

    const company = await prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // BUG-20: protocolo único com retry
    const protocol = await generateUniqueProtocol();

    const report = await prisma.whistleblowerReport.create({
      data: {
        companyId: company.id,
        topic,
        description,
        priority: safePriority,
        protocol,
        status: "OPEN",
        ipHash, // BUG-19: preencher ipHash
      },
    });

    return NextResponse.json({
      success: true,
      protocol: report.protocol,
      message: "Denúncia enviada com sucesso. Guarde seu protocolo para acompanhar.",
    });
  } catch (err) {
    console.error("[whistleblower]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

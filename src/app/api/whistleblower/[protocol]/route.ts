import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptString } from "@/lib/encryption";
import { logger } from "@/lib/logger";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ protocol: string }> }
) {
  const { protocol } = await params;
  try {
    const report = await prisma.whistleblowerReport.findUnique({
      where: { protocol },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        company: { select: { name: true, logoUrl: true } }
      }
    });

    if (!report) {
      return NextResponse.json({ error: "Protocolo não encontrado" }, { status: 404 });
    }

    // Descriptografa a descrição se estiver no formato `enc:v1:...`.
    // Valores legados (texto puro) passam direto.
    return NextResponse.json({
      ...report,
      description: decryptString(report.description),
    });
  } catch (err) {
    logger.error({ scope: "whistleblower", err, protocol }, "erro ao ler denúncia");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

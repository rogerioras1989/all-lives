import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function generateProtocol(): string {
  // Gera um protocolo amigável: YYYY-XXXX-XXXX
  const year = new Date().getFullYear();
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${year}-${rand.slice(0, 4)}-${rand.slice(4)}`;
}

export async function POST(req: NextRequest) {
  try {
    const { companySlug, topic, description, priority } = await req.json();

    if (!companySlug || !topic || !description) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { slug: companySlug }
    });

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const protocol = generateProtocol();

    const report = await prisma.whistleblowerReport.create({
      data: {
        companyId: company.id,
        topic,
        description,
        priority: priority || "MEDIUM",
        protocol,
        status: "OPEN",
      }
    });

    return NextResponse.json({
      success: true,
      protocol: report.protocol,
      message: "Denúncia enviada com sucesso. Guarde seu protocolo para acompanhar."
    });

  } catch (err) {
    console.error("[whistleblower]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

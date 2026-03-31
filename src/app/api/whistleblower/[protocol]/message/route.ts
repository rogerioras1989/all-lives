import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ protocol: string }> }
) {
  const { protocol } = await params;
  try {
    const { text, sender } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
    }

    const report = await prisma.whistleblowerReport.findUnique({
      where: { protocol }
    });

    if (!report) {
      return NextResponse.json({ error: "Protocolo não encontrado" }, { status: 404 });
    }

    const message = await prisma.whistleblowerMessage.create({
      data: {
        reportId: report.id,
        text,
        sender: sender || "ANONYMOUS",
      }
    });

    return NextResponse.json(message);
  } catch (err) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

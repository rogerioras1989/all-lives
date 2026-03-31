import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
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

    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

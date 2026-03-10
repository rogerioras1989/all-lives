import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { responses: true } },
      },
    });
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, company, description } = body;

    if (!title || !company) {
      return NextResponse.json(
        { error: "Título e empresa são obrigatórios" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: { title, company, description, status: "ACTIVE" },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error(error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get("empresa")?.trim();
  if (!empresa) {
    return NextResponse.json({ error: "Informe o nome ou código da empresa." }, { status: 400 });
  }

  // Busca por slug exato ou nome case-insensitive
  const company = await prisma.company.findFirst({
    where: {
      OR: [
        { slug: empresa.toLowerCase() },
        { name: { contains: empresa, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, slug: true, logoUrl: true },
  });

  if (!company) {
    return NextResponse.json({ error: "Empresa não encontrada. Verifique o nome e tente novamente." }, { status: 404 });
  }

  // Busca campanha ativa mais recente
  const campaign = await prisma.campaign.findFirst({
    where: { companyId: company.id, status: "ACTIVE" },
    orderBy: { startDate: "desc" },
    select: { id: true, title: true },
  });

  if (!campaign) {
    return NextResponse.json(
      { error: "Nenhuma pesquisa ativa encontrada para esta empresa no momento." },
      { status: 404 }
    );
  }

  return NextResponse.json({ company, campaign });
}

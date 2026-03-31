import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin, adminError } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { campaigns: true, users: true } },
        campaigns: {
          where: { status: "ACTIVE" },
          select: { id: true, title: true },
          take: 1,
        },
      },
    });
    return NextResponse.json(companies);
  } catch (err) {
    const { error, status } = adminError(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);
    const { name, slug, password } = await req.json();
    if (!name || !slug || !password) {
      return NextResponse.json({ error: "Nome, código e senha são obrigatórios." }, { status: 400 });
    }
    const adminPasswordHash = await bcrypt.hash(password, 12);
    const company = await prisma.company.create({
      data: { name, slug: slug.toLowerCase().trim(), adminPasswordHash },
    });
    return NextResponse.json(company, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Código de empresa já em uso." }, { status: 409 });
    }
    const { error, status } = adminError(err);
    return NextResponse.json({ error }, { status });
  }
}

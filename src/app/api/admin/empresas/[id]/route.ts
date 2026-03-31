import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin, adminError } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        campaigns: {
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { responses: true } } },
        },
        _count: { select: { users: true } },
      },
    });
    if (!company) return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
    return NextResponse.json(company);
  } catch (err) {
    const { error, status } = adminError(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const { name, slug, password } = await req.json();
    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (slug) data.slug = slug.toLowerCase().trim();
    if (password) data.adminPasswordHash = await bcrypt.hash(password, 12);
    const company = await prisma.company.update({ where: { id }, data });
    return NextResponse.json(company);
  } catch (err) {
    const { error, status } = adminError(err);
    return NextResponse.json({ error }, { status });
  }
}

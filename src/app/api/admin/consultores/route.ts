import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin, adminError } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    const consultants = await prisma.consultant.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, globalRole: true,
        lastLoginAt: true, createdAt: true,
        _count: { select: { companies: true } },
      },
    });
    return NextResponse.json(consultants);
  } catch (err) {
    const { error, status } = adminError(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);
    const { name, email, password, globalRole } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nome, email e senha são obrigatórios." }, { status: 400 });
    }
    const hash = await bcrypt.hash(password, 12);
    const consultant = await prisma.consultant.create({
      data: { name, email: email.toLowerCase().trim(), password: hash, globalRole: globalRole ?? "CONSULTANT" },
      select: { id: true, name: true, email: true, globalRole: true, createdAt: true },
    });
    return NextResponse.json(consultant, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 });
    }
    const { error, status } = adminError(err);
    return NextResponse.json({ error }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    // Only consultants can call this
    if (payload.type !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const links = await prisma.consultantCompany.findMany({
      where: { consultantId: payload.sub },
      include: {
        company: {
          include: {
            campaigns: {
              select: { id: true, title: true, status: true, slug: true, createdAt: true },
              orderBy: { createdAt: "desc" },
            },
            users: { select: { id: true } },
          },
        },
      },
    });

    const companies = links.map((l) => ({
      id: l.company.id,
      name: l.company.name,
      cnpj: l.company.cnpj,
      slug: l.company.slug,
      role: l.role,
      totalUsers: l.company.users.length,
      campaigns: l.company.campaigns,
    }));

    return NextResponse.json({ companies });
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

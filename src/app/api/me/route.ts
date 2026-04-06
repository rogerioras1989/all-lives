import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/middleware";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const payload = getAuthPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (payload.type === "consultant") {
    const consultant = await prisma.consultant.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, globalRole: true },
    });
    if (!consultant) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ type: "consultant", role: consultant.globalRole, ...consultant });
  }

  // BUG-3: tratar login de empresa (type "company") — retorna dados da company, não de um User
  if (payload.type === "company") {
    const company = await prisma.company.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
    if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      type: "company",
      role: "HR",
      id: company.id,
      name: company.name,
      companyId: company.id,
      company,
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true, name: true, email: true, role: true, sector: true,
      companyId: true, totpEnabled: true,
      company: { select: { id: true, name: true, slug: true, logoUrl: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ type: "user", ...user });
}

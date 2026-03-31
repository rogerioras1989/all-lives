import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, adminError } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = requireAdmin(req);
    const { id } = await params;
    if (me.sub === id) {
      return NextResponse.json({ error: "Você não pode remover sua própria conta." }, { status: 400 });
    }
    await prisma.consultant.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { error, status } = adminError(err);
    return NextResponse.json({ error }, { status });
  }
}

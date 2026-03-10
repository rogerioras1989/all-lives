import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTotp } from "@/lib/auth";
import { requireAuth } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { token } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.totpSecret) {
      return NextResponse.json({ error: "TOTP não configurado" }, { status: 400 });
    }

    const ok = verifyTotp(token, user.totpSecret);
    if (!ok) return NextResponse.json({ error: "Código inválido" }, { status: 401 });

    // Enable TOTP
    await prisma.user.update({
      where: { id: user.id },
      data: { totpEnabled: true },
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

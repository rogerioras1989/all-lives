import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTotpSecret, generateQrCodeDataUrl, encryptTotpSecret } from "@/lib/auth";
import { requireAuth } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // fix #10 — não permitir sobrescrever TOTP já habilitado
    if (user.totpEnabled) {
      return NextResponse.json(
        { error: "2FA já está ativo. Desative antes de reconfigurar." },
        { status: 409 }
      );
    }

    const email = user.email || user.id;
    const { secret, otpauthUrl } = generateTotpSecret(email);
    const qrCode = await generateQrCodeDataUrl(otpauthUrl);

    // Save encrypted secret but don't enable yet (need to verify first) — fix #17
    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: encryptTotpSecret(secret), totpEnabled: false },
    });

    // fix #10 — não retornar o secret base32 em texto claro; apenas o QR code é suficiente
    return NextResponse.json({ qrCode });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  getTenantContext,
  requireCampaignOwnership,
  requireTenantAnalytics,
  tenantError,
} from "@/lib/tenant";

export const runtime = "nodejs";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const qrcode = require("qrcode") as typeof import("qrcode");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getTenantContext(req);
    const campaign = await requireCampaignOwnership(id, ctx);
    requireTenantAnalytics(ctx);

    // C-4: nunca usar Host header para construir URLs — open redirect via header injection
    const baseUrl = process.env.NEXTAUTH_URL;
    if (!baseUrl) {
      console.error("[qrcode] NEXTAUTH_URL não configurado — impossível gerar QR seguro");
      return NextResponse.json({ error: "Configuração de URL ausente" }, { status: 500 });
    }
    const url = `${baseUrl}/r/${campaign.slug}`;

    const dataUrl = await qrcode.toDataURL(url, {
      width: 300, margin: 2,
      color: { dark: "#1e5f7a", light: "#ffffff" },
    });

    return NextResponse.json({ qrCode: dataUrl, url });
  } catch (err) {
    const { error, status } = tenantError(err);
    return NextResponse.json({ error }, { status });
  }
}

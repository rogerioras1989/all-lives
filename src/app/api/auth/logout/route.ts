import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  const payload = getAuthPayload(req);
  if (payload) {
    await prisma.user.update({
      where: { id: payload.sub },
      data: { refreshTokenHash: null },
    }).catch(() => {});
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("access_token");
  res.cookies.delete("refresh_token");
  return res;
}

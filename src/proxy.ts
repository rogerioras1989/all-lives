import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// fix #7 — falha explicitamente se JWT_SECRET não estiver definida (nunca encode string vazia)
if (!process.env.JWT_SECRET) {
  throw new Error("[middleware] JWT_SECRET não está definida. Configure a variável de ambiente.");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const PROTECTED = ["/dashboard", "/admin", "/campanhas", "/consultor"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /consultor/login is public
  if (pathname.startsWith("/consultor/login")) return NextResponse.next();

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // JWT_SECRET must be set
  if (!process.env.JWT_SECRET) {
    console.error("[middleware] JWT_SECRET not configured");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("access_token");
    return res;
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/campanhas/:path*",
    "/consultor/:path*",
  ],
};

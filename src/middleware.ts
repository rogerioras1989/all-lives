import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const PROTECTED = ["/dashboard", "/admin", "/campanhas", "/consultor"];

// ── In-memory rate limiting (fix #12) ────────────────────────────────────────
// Sliding window: max 20 requests per IP per 60 seconds on auth endpoints
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const RATE_LIMITED_PATHS = ["/api/auth/login", "/api/consultor/login", "/api/auth/refresh"];

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return true; // allowed
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return false; // blocked
  return true;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limit auth endpoints
  if (RATE_LIMITED_PATHS.some((p) => pathname.startsWith(p))) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    if (!checkRateLimit(ip)) {
      return new NextResponse(
        JSON.stringify({ error: "Muitas tentativas. Tente novamente em 1 minuto." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      );
    }
  }

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
    "/api/auth/login",
    "/api/consultor/login",
    "/api/auth/refresh",
  ],
};

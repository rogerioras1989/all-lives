import { NextRequest } from "next/server";
import { verifyAccessToken, AccessTokenPayload } from "./auth";

export function getAuthPayload(req: NextRequest): AccessTokenPayload | null {
  try {
    const token =
      req.cookies.get("access_token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return null;
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

export function requireAuth(req: NextRequest): AccessTokenPayload {
  const payload = getAuthPayload(req);
  if (!payload) throw new Error("UNAUTHORIZED");
  return payload;
}

export function requireRole(req: NextRequest, roles: string[]): AccessTokenPayload {
  const payload = requireAuth(req);
  if (!roles.includes(payload.role)) throw new Error("FORBIDDEN");
  return payload;
}

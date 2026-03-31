import { NextRequest } from "next/server";
import { getAuthPayload } from "./middleware";

export function requireAdmin(req: NextRequest) {
  const payload = getAuthPayload(req);
  if (!payload || payload.type !== "consultant" || payload.role !== "OWNER") {
    throw new Error("FORBIDDEN");
  }
  return payload;
}

export function adminError(err: unknown) {
  if (err instanceof Error && err.message === "FORBIDDEN")
    return { error: "Acesso negado.", status: 403 };
  if (err instanceof Error && err.message === "UNAUTHORIZED")
    return { error: "Não autenticado.", status: 401 };
  console.error("[admin]", err);
  return { error: "Erro interno.", status: 500 };
}

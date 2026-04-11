import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";

/**
 * Wrappers de validação para rotas Next.js App Router.
 *
 * Padroniza o tratamento de input em rotas `/api/*`:
 *  - Body JSON
 *  - Query string (URLSearchParams)
 *  - Route params dinâmicos
 *
 * Em caso de erro de validação, devolve um 400 estruturado em vez de 500.
 *
 * Exemplo:
 *
 * ```ts
 * const Body = z.object({ campaignId: z.string().min(1) });
 *
 * export const POST = withJsonBody(Body, async (body, req) => {
 *   // body é tipado a partir do schema
 *   return NextResponse.json({ ok: true, body });
 * });
 * ```
 */

export type ValidationErrorPayload = {
  error: string;
  details: Array<{ path: string; message: string }>;
};

function formatZodError(error: ZodError): ValidationErrorPayload {
  return {
    error: "Dados inválidos",
    details: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}

export function validationErrorResponse(error: ZodError) {
  return NextResponse.json(formatZodError(error), { status: 400 });
}

/**
 * Tenta parsear `req.json()` e validar contra o schema.
 * Retorna `{ ok: true, data }` ou `{ ok: false, response }`.
 */
export async function parseJsonBody<S extends ZodType>(
  req: NextRequest,
  schema: S
): Promise<
  | { ok: true; data: ReturnType<S["parse"]> }
  | { ok: false; response: NextResponse }
> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "JSON inválido no corpo da requisição" },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return { ok: false, response: validationErrorResponse(result.error) };
  }
  return { ok: true, data: result.data as ReturnType<S["parse"]> };
}

/**
 * Valida `req.nextUrl.searchParams` (URLSearchParams achatado para objeto)
 * contra um schema Zod. Útil para query strings.
 */
export function parseSearchParams<S extends ZodType>(
  req: NextRequest,
  schema: S
):
  | { ok: true; data: ReturnType<S["parse"]> }
  | { ok: false; response: NextResponse } {
  const url = new URL(req.url);
  const obj: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    obj[key] = value;
  }
  const result = schema.safeParse(obj);
  if (!result.success) {
    return { ok: false, response: validationErrorResponse(result.error) };
  }
  return { ok: true, data: result.data as ReturnType<S["parse"]> };
}

/**
 * High-level helper que recebe um schema e um handler tipado, devolvendo
 * um handler de rota Next compatível com `export const POST = ...`.
 */
export function withJsonBody<S extends ZodType>(
  schema: S,
  handler: (
    body: ReturnType<S["parse"]>,
    req: NextRequest
  ) => Promise<NextResponse> | NextResponse
) {
  return async (req: NextRequest) => {
    const parsed = await parseJsonBody(req, schema);
    if (!parsed.ok) return parsed.response;
    return handler(parsed.data, req);
  };
}

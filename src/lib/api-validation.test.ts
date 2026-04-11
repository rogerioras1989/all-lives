import { describe, it, expect } from "vitest";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import {
  parseJsonBody,
  parseSearchParams,
  withJsonBody,
} from "./api-validation";

function makeJsonRequest(body: unknown) {
  return new NextRequest("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function makeSearchRequest(qs: string) {
  return new NextRequest(`http://localhost/api/test${qs}`);
}

describe("parseJsonBody", () => {
  const schema = z.object({
    campaignId: z.string().min(1),
    sector: z.string().min(1),
  });

  it("retorna ok=true para body válido", async () => {
    const req = makeJsonRequest({ campaignId: "c1", sector: "RH" });
    const result = await parseJsonBody(req, schema);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ campaignId: "c1", sector: "RH" });
    }
  });

  it("retorna 400 para body inválido", async () => {
    const req = makeJsonRequest({ campaignId: "", sector: "RH" });
    const result = await parseJsonBody(req, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toBe("Dados inválidos");
      expect(Array.isArray(body.details)).toBe(true);
      expect(body.details[0].path).toBe("campaignId");
    }
  });

  it("retorna 400 quando o JSON é malformado", async () => {
    const req = makeJsonRequest("not-json{");
    const result = await parseJsonBody(req, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toMatch(/JSON inválido/i);
    }
  });
});

describe("parseSearchParams", () => {
  const schema = z.object({
    sector: z.string().min(1),
    page: z.coerce.number().int().min(1).optional(),
  });

  it("aceita query string válida e coage tipos", () => {
    const req = makeSearchRequest("?sector=RH&page=2");
    const result = parseSearchParams(req, schema);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sector).toBe("RH");
      expect(result.data.page).toBe(2);
    }
  });

  it("rejeita query string inválida", () => {
    const req = makeSearchRequest("?sector=&page=abc");
    const result = parseSearchParams(req, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
    }
  });
});

describe("withJsonBody", () => {
  it("invoca o handler com body validado", async () => {
    const schema = z.object({ name: z.string().min(2) });
    const handler = withJsonBody(schema, async (body) =>
      NextResponse.json({ greeting: `Olá, ${body.name}` })
    );
    const res = await handler(makeJsonRequest({ name: "Maria" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.greeting).toBe("Olá, Maria");
  });

  it("não invoca o handler quando o body é inválido", async () => {
    const schema = z.object({ name: z.string().min(5) });
    let called = false;
    const handler = withJsonBody(schema, async () => {
      called = true;
      return NextResponse.json({});
    });
    const res = await handler(makeJsonRequest({ name: "ab" }));
    expect(called).toBe(false);
    expect(res.status).toBe(400);
  });
});

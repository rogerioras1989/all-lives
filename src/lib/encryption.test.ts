import { describe, it, expect, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import { decryptString, encryptString, isEncrypted } from "./encryption";

const VALID_KEY = crypto.randomBytes(32).toString("hex");

describe("encryption (com APP_ENCRYPTION_KEY)", () => {
  const previous = process.env.APP_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.APP_ENCRYPTION_KEY = VALID_KEY;
  });

  afterEach(() => {
    if (previous === undefined) delete process.env.APP_ENCRYPTION_KEY;
    else process.env.APP_ENCRYPTION_KEY = previous;
  });

  it("encrypta strings com prefixo enc:v1:", () => {
    const out = encryptString("denúncia confidencial");
    expect(out.startsWith("enc:v1:")).toBe(true);
    expect(isEncrypted(out)).toBe(true);
    expect(out).not.toContain("denúncia");
  });

  it("descriptografa de volta para o plaintext original", () => {
    const text = "Texto sensível com acentuação e símbolos !@#$%";
    const enc = encryptString(text);
    const dec = decryptString(enc);
    expect(dec).toBe(text);
  });

  it("não recriptografa um valor já criptografado", () => {
    const enc = encryptString("hello");
    const enc2 = encryptString(enc);
    expect(enc2).toBe(enc);
  });

  it("aceita valores legados (sem prefixo) no decrypt", () => {
    expect(decryptString("texto puro legado")).toBe("texto puro legado");
  });

  it("gera IVs diferentes para o mesmo plaintext", () => {
    const a = encryptString("igual");
    const b = encryptString("igual");
    expect(a).not.toBe(b);
    expect(decryptString(a)).toBe("igual");
    expect(decryptString(b)).toBe("igual");
  });

  it("falha quando o ciphertext está corrompido", () => {
    const enc = encryptString("hello");
    const corrupted = enc.slice(0, -2) + "00";
    expect(() => decryptString(corrupted)).toThrow();
  });
});

describe("encryption (sem APP_ENCRYPTION_KEY)", () => {
  const previous = process.env.APP_ENCRYPTION_KEY;

  beforeEach(() => {
    delete process.env.APP_ENCRYPTION_KEY;
  });

  afterEach(() => {
    if (previous === undefined) delete process.env.APP_ENCRYPTION_KEY;
    else process.env.APP_ENCRYPTION_KEY = previous;
  });

  it("encryptString devolve o plaintext em modo sem chave", () => {
    expect(encryptString("teste")).toBe("teste");
  });

  it("decryptString devolve plaintext quando não há prefixo", () => {
    expect(decryptString("teste")).toBe("teste");
  });
});

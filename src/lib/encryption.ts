import crypto from "crypto";

/**
 * Helpers genéricos de criptografia em repouso (AES-256-GCM).
 *
 * Reutiliza o mesmo esquema usado em `auth.ts` para `encryptTotpSecret`,
 * exposto de forma genérica para outros campos sensíveis (ex.: descrição
 * de denúncia anônima).
 *
 * Formato: `enc:v1:<ivHex>:<tagHex>:<cipherHex>`
 *
 * - O prefixo `enc:v1:` permite detectar valores legados não criptografados
 *   e migrar gradualmente.
 * - Se `APP_ENCRYPTION_KEY` não estiver configurado, o helper devolve o
 *   plaintext (modo dev/teste) — evita quebrar o boot mas registra um aviso.
 *
 * NOTA: para dados realmente sensíveis em produção, configure a chave.
 */

const ENCRYPTION_PREFIX = "enc:v1:";

let warnedAboutMissingKey = false;

function readKey(): Buffer | null {
  const hex = process.env.APP_ENCRYPTION_KEY;
  if (!hex) {
    if (!warnedAboutMissingKey) {
      warnedAboutMissingKey = true;
      // Não usamos o pino aqui para evitar dependência circular com logger.
      console.warn(
        "[encryption] APP_ENCRYPTION_KEY ausente — campos sensíveis serão armazenados em texto puro."
      );
    }
    return null;
  }
  try {
    const buf = Buffer.from(hex, "hex");
    if (buf.length !== 32) {
      throw new Error(`tamanho inválido: ${buf.length} bytes (esperado 32)`);
    }
    return buf;
  } catch (err) {
    throw new Error(
      `[encryption] APP_ENCRYPTION_KEY inválida: ${(err as Error).message}`
    );
  }
}

/**
 * Criptografa uma string. Se a chave não estiver disponível, retorna o
 * plaintext (com aviso). Strings já criptografadas (com o prefixo) não são
 * recriptografadas.
 */
export function encryptString(plain: string): string {
  if (typeof plain !== "string") {
    throw new TypeError("encryptString espera string");
  }
  if (plain.startsWith(ENCRYPTION_PREFIX)) {
    return plain; // já criptografado
  }
  const key = readKey();
  if (!key) return plain;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENCRYPTION_PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

/**
 * Descriptografa um valor produzido por `encryptString`. Valores sem prefixo
 * (legados ou nunca criptografados) são devolvidos como vieram.
 */
export function decryptString(stored: string): string {
  if (typeof stored !== "string") {
    throw new TypeError("decryptString espera string");
  }
  if (!stored.startsWith(ENCRYPTION_PREFIX)) {
    return stored;
  }
  const key = readKey();
  if (!key) {
    throw new Error(
      "[encryption] valor criptografado encontrado mas APP_ENCRYPTION_KEY não está configurada"
    );
  }
  const payload = stored.slice(ENCRYPTION_PREFIX.length);
  const [ivHex, tagHex, encHex] = payload.split(":");
  if (!ivHex || !tagHex || !encHex) {
    throw new Error("[encryption] formato inválido");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return (
    decipher.update(Buffer.from(encHex, "hex")).toString("utf8") +
    decipher.final("utf8")
  );
}

export function isEncrypted(value: string): boolean {
  return typeof value === "string" && value.startsWith(ENCRYPTION_PREFIX);
}

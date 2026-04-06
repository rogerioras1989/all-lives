import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import qrcode from "qrcode";

// ── Secrets — fail hard at startup if not configured ─────────────────────────
function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

// Lazy initialisation so missing vars only throw on first use (not import time)
function getJwtSecret(): string {
  return requireEnv("JWT_SECRET");
}
function getCpfHmacSecret(): string {
  return requireEnv("CPF_HMAC_SECRET");
}
function getEncryptionKey(): Buffer {
  const hex = requireEnv("APP_ENCRYPTION_KEY");
  return Buffer.from(hex, "hex");
}

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";

// ── CPF — HMAC-SHA256 with secret (fix #2) ───────────────────────────────────

export function hashCpf(cpf: string): string {
  const clean = cpf.replace(/\D/g, "");
  return crypto.createHmac("sha256", getCpfHmacSecret()).update(clean).digest("hex");
}

// ── PIN ───────────────────────────────────────────────────────────────────────

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

// ── TOTP secret encryption — AES-256-GCM (fix #17) ───────────────────────────

export function encryptTotpSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptTotpSecret(stored: string): string {
  // Gracefully handle unencrypted legacy secrets (base32 never contains ":")
  if (!stored.includes(":")) return stored;
  const [ivHex, tagHex, encHex] = stored.split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return decipher.update(Buffer.from(encHex, "hex")).toString("utf8") + decipher.final("utf8");
}

// ── TOTP ──────────────────────────────────────────────────────────────────────

export function generateTotpSecret(email: string): { secret: string; otpauthUrl: string } {
  const generated = speakeasy.generateSecret({
    name: `DRPS All Lives (${email})`,
    issuer: "All Lives",
    length: 20,
  });
  return {
    secret: generated.base32!,
    otpauthUrl: generated.otpauth_url!,
  };
}

export async function generateQrCodeDataUrl(otpauthUrl: string): Promise<string> {
  return qrcode.toDataURL(otpauthUrl);
}

export function verifyTotp(token: string, secret: string): boolean {
  const plainSecret = decryptTotpSecret(secret);
  return speakeasy.totp.verify({
    secret: plainSecret,
    encoding: "base32",
    token,
    window: 1, // A-2: window=1 aceita ±30s de clock skew (RFC 6238 recomendado)
  });
}

// ── JWT ───────────────────────────────────────────────────────────────────────

export interface AccessTokenPayload {
  sub: string;       // userId, consultantId, or companyId
  role: string;
  companyId?: string;
  type: "user" | "consultant" | "company";
}

export interface RefreshTokenPayload {
  sub: string;
  type: "user" | "consultant";
  jti: string;       // random id to allow revocation
}

export function signAccessToken(payload: AccessTokenPayload, expiresIn = ACCESS_TOKEN_TTL): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn } as jwt.SignOptions);
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, "jti">): string {
  const jti = crypto.randomUUID();
  return jwt.sign({ ...payload, jti }, getJwtSecret(), { expiresIn: REFRESH_TOKEN_TTL });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, getJwtSecret()) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, getJwtSecret()) as RefreshTokenPayload;
}

// M-5: avisar em startup se NEXTAUTH_SECRET e JWT_SECRET são idênticos
if (
  typeof process !== "undefined" &&
  process.env.NEXTAUTH_SECRET &&
  process.env.JWT_SECRET &&
  process.env.NEXTAUTH_SECRET === process.env.JWT_SECRET
) {
  console.warn("[auth] AVISO DE SEGURANÇA: NEXTAUTH_SECRET e JWT_SECRET são idênticos. Use valores distintos para limitar blast radius em caso de comprometimento.");
}

// fix #7 — cost 12 (was 10)
export async function hashRefreshToken(token: string): Promise<string> {
  return bcrypt.hash(token, 12);
}

export async function verifyRefreshTokenHash(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

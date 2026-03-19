import { createHash } from "crypto";

const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/;

export function hashIntegrationKey(rawKey: string) {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function isHashedIntegrationKey(value: string) {
  return SHA256_HEX_REGEX.test(value);
}

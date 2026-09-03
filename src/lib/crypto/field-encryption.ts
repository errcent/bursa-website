import crypto from "node:crypto";

const PREFIX = "enc:v1:";
const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

function encryptionKey(): Buffer {
  const raw = process.env.FIELD_ENCRYPTION_KEY?.trim();
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FIELD_ENCRYPTION_KEY is required in production for PII encryption.");
    }
    return crypto.createHash("sha256").update("bursa-dev-field-encryption-key").digest();
  }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  return crypto.createHash("sha256").update(raw).digest();
}

export function isEncryptedField(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptField(plaintext: string): string {
  const iv = crypto.randomBytes(IV_BYTES);
  // Semgrep requires a literal authTagLength (not a const alias).
  const cipher = crypto.createCipheriv(ALGO, encryptionKey(), iv, {
    authTagLength: 16,
  });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptField(value: string): string {
  if (!isEncryptedField(value)) return value;
  const body = value.slice(PREFIX.length);
  const [ivB64, tagB64, dataB64] = body.split(".");
  if (!ivB64 || !tagB64 || !dataB64) return value;
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  if (iv.length !== IV_BYTES || tag.length !== AUTH_TAG_BYTES) return value;
  // Semgrep requires a literal authTagLength (not a const alias).
  const decipher = crypto.createDecipheriv(ALGO, encryptionKey(), iv, {
    authTagLength: 16,
  });
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function hashPhoneForLookup(phone: string): string {
  const normalized = phone.replace(/\s+/g, "").trim().toLowerCase();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

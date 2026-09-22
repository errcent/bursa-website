import { decryptField, encryptField } from "@/lib/crypto/field-encryption";

/**
 * Credential envelope for broker sync. The encryption key lives in the
 * server environment (FIELD_ENCRYPTION_KEY), physically separated from
 * the database that stores these envelopes.
 */

export function sealCredentials(payload: Record<string, string>): string {
  return encryptField(JSON.stringify(payload));
}

export function unsealCredentials<T>(sealed: string): T | null {
  try {
    const raw = decryptField(sealed);
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as T;
  } catch {
    return null;
  }
}

/** Last-4 hint for UI display. Never log or return full keys. */
export function keyHint(key: string): string {
  const tail = key.trim().slice(-4);
  return tail ? `••••${tail}` : "••••";
}

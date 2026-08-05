import { getAuthSecret } from "@/lib/auth/auth-secret";

const WEB_SESSION_TTL_SEC = 7 * 24 * 60 * 60;

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function verifyHs256(
  signingInput: string,
  signatureB64: string,
  secret: string
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sig = base64UrlDecode(signatureB64);
  return crypto.subtle.verify(
    "HMAC",
    key,
    sig.buffer.slice(sig.byteOffset, sig.byteOffset + sig.byteLength) as ArrayBuffer,
    new TextEncoder().encode(signingInput)
  );
}

/** Edge-safe JWT verify for `bursa_web_session` (HS256, no jose/Prisma). */
export async function verifyWebSessionTokenEdge(
  token: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(headerB64))) as {
      alg?: string;
    };
    if (header.alg !== "HS256") return null;

    const valid = await verifyHs256(
      `${headerB64}.${payloadB64}`,
      signatureB64,
      getAuthSecret()
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64))) as {
      sub?: string;
      email?: string;
      typ?: string;
      exp?: number;
    };
    if (payload.typ !== "web_session") return null;
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) return null;
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const email =
      typeof payload.email === "string" ? payload.email.trim().toLowerCase() : null;
    if (!userId || !email) return null;
    return { userId, email };
  } catch {
    return null;
  }
}

export { WEB_SESSION_TTL_SEC };

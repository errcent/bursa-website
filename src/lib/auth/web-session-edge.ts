import { getAuthSecret } from "@/lib/auth/auth-secret";
import { isUpstashRateLimitConfigured } from "@/lib/auth/rate-limit-upstash";
import { WEB_SESSION_SV_REDIS_PREFIX } from "@/lib/auth/web-session.constants";

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

async function readSessionVersionEdge(userId: string): Promise<number | null> {
  if (!isUpstashRateLimitConfigured()) return null;
  try {
    const { Redis } = await import("@upstash/redis");
    const value = await Redis.fromEnv().get(`${WEB_SESSION_SV_REDIS_PREFIX}${userId}`);
    if (value == null) return null;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
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
      jti?: string;
      sv?: number;
    };
    if (payload.typ !== "web_session") return null;
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) return null;
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const email =
      typeof payload.email === "string" ? payload.email.trim().toLowerCase() : null;
    const jti = typeof payload.jti === "string" ? payload.jti : null;
    if (!userId || !email || !jti) return null;

    const { isWebSessionJtiRevokedEdge } = await import("@/lib/auth/revoked-web-session-edge");
    if (await isWebSessionJtiRevokedEdge(jti)) return null;

    // U-005: when Redis has a sessionVersion, reject stale JWTs.
    const tokenSv = typeof payload.sv === "number" ? payload.sv : 0;
    const currentSv = await readSessionVersionEdge(userId);
    if (currentSv != null && tokenSv !== currentSv) return null;

    return { userId, email };
  } catch {
    return null;
  }
}

export { WEB_SESSION_TTL_SEC };

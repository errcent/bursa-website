import { SignJWT, jwtVerify } from "jose";

import { getAuthSecret } from "@/lib/auth/auth-secret";
import { isWebSessionJtiRevoked } from "@/lib/auth/revoked-web-session";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session.constants";

export { WEB_SESSION_COOKIE };
export const WEB_SESSION_TTL_SEC = 7 * 24 * 60 * 60;

function secretKey(): Uint8Array {
  return new TextEncoder().encode(getAuthSecret());
}

export function webSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: WEB_SESSION_TTL_SEC,
    // Host-only on purpose. Never set Domain=.bursanalar.com — that would share
    // admin.bursanalar.com sessions with the public site (XSS blast radius).
  };
}

export async function signWebSessionToken(user: {
  id: string;
  email: string;
}): Promise<string> {
  const jti = crypto.randomUUID();
  return new SignJWT({
    sub: user.id,
    email: user.email.trim().toLowerCase(),
    typ: "web_session",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${WEB_SESSION_TTL_SEC}s`)
    .sign(secretKey());
}

export async function readWebSessionPayload(token: string): Promise<{
  userId: string;
  email: string;
  jti: string;
  exp: number;
} | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.typ !== "web_session") return null;
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const email =
      typeof payload.email === "string" ? payload.email.trim().toLowerCase() : null;
    const jti = typeof payload.jti === "string" ? payload.jti : null;
    const exp = typeof payload.exp === "number" ? payload.exp : null;
    if (!userId || !email || !jti || !exp) return null;
    return { userId, email, jti, exp };
  } catch {
    return null;
  }
}

export async function verifyWebSessionToken(
  token: string
): Promise<{ userId: string; email: string } | null> {
  const session = await readWebSessionPayload(token);
  if (!session) return null;
  if (await isWebSessionJtiRevoked(session.jti)) return null;
  return { userId: session.userId, email: session.email };
}

export function readWebSessionToken(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === WEB_SESSION_COOKIE) {
      const value = rest.join("=").trim();
      return value || null;
    }
  }
  return null;
}

import { SignJWT, jwtVerify } from "jose";

import { getAuthSecret } from "@/lib/auth/auth-secret";
import { isWebSessionJtiRevoked } from "@/lib/auth/revoked-web-session";
import { getWebSessionVersion } from "@/lib/auth/session-version";
import {
  WEB_SESSION_COOKIE,
  WEB_SESSION_REMEMBER_TTL_SEC,
} from "@/lib/auth/web-session.constants";
import { db } from "@/lib/db";

export { WEB_SESSION_COOKIE };
export const WEB_SESSION_TTL_SEC = 7 * 24 * 60 * 60;
export { WEB_SESSION_REMEMBER_TTL_SEC };
export const WEB_SESSION_SHORT_TTL_SEC = 24 * 60 * 60;

function secretKey(): Uint8Array {
  return new TextEncoder().encode(getAuthSecret());
}

export function webSessionCookieOptions(rememberMe = true) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(rememberMe
      ? { maxAge: WEB_SESSION_REMEMBER_TTL_SEC }
      : { maxAge: WEB_SESSION_SHORT_TTL_SEC }),
  };
}

export async function signWebSessionToken(
  user: {
    id: string;
    email: string;
    sessionVersion?: number;
  },
  rememberMe = true
): Promise<string> {
  const ttlSec = rememberMe ? WEB_SESSION_REMEMBER_TTL_SEC : WEB_SESSION_SHORT_TTL_SEC;
  const jti = crypto.randomUUID();
  const sv =
    typeof user.sessionVersion === "number"
      ? user.sessionVersion
      : await getWebSessionVersion(user.id);
  return new SignJWT({
    sub: user.id,
    email: user.email.trim().toLowerCase(),
    typ: "web_session",
    sv,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${ttlSec}s`)
    .sign(secretKey());
}

export async function readWebSessionPayload(token: string): Promise<{
  userId: string;
  email: string;
  jti: string;
  exp: number;
  sv: number;
} | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.typ !== "web_session") return null;
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const email =
      typeof payload.email === "string" ? payload.email.trim().toLowerCase() : null;
    const jti = typeof payload.jti === "string" ? payload.jti : null;
    const exp = typeof payload.exp === "number" ? payload.exp : null;
    const sv = typeof payload.sv === "number" ? payload.sv : 0;
    if (!userId || !email || !jti || !exp) return null;
    return { userId, email, jti, exp, sv };
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

  const current = await db.user.findUnique({
    where: { id: session.userId },
    select: { sessionVersion: true },
  });
  if (!current) return null;
  if (session.sv !== current.sessionVersion) return null;

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

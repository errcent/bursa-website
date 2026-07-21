import { SignJWT, jwtVerify } from "jose";

import { getAuthSecret } from "@/lib/auth/google-oauth";

export const WEB_SESSION_COOKIE = "bursa_web_session";
const WEB_SESSION_TTL_SEC = 7 * 24 * 60 * 60;

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
  };
}

export async function signWebSessionToken(user: {
  id: string;
  email: string;
}): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email.trim().toLowerCase(),
    typ: "web_session",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${WEB_SESSION_TTL_SEC}s`)
    .sign(secretKey());
}

export async function verifyWebSessionToken(
  token: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.typ !== "web_session") return null;
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const email =
      typeof payload.email === "string" ? payload.email.trim().toLowerCase() : null;
    if (!userId || !email) return null;
    return { userId, email };
  } catch {
    return null;
  }
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

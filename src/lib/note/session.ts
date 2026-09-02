import { SignJWT, jwtVerify } from "jose";

import { getAuthSecret } from "@/lib/auth/auth-secret";
import type { NoteScope, NoteSession } from "@/lib/note/types";

export const NOTE_SESSION_COOKIE = "bursa_note_session";
export const NOTE_SESSION_TTL_SEC = 7 * 24 * 60 * 60;
export const NOTE_SCOPES: NoteScope[] = ["note.read", "note.write"];

function secretKey(): Uint8Array {
  return new TextEncoder().encode(`${getAuthSecret()}:note`);
}

export function noteSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: NOTE_SESSION_TTL_SEC,
  };
}

export async function signNoteSessionToken(user: {
  id: string;
  email: string;
  scopes?: NoteScope[];
}): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email.trim().toLowerCase(),
    typ: "note_session",
    scopes: user.scopes ?? NOTE_SCOPES,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${NOTE_SESSION_TTL_SEC}s`)
    .sign(secretKey());
}

export async function verifyNoteSessionToken(token: string): Promise<NoteSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.typ !== "note_session") return null;
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : null;
    const scopes = Array.isArray(payload.scopes)
      ? payload.scopes.filter((s): s is NoteScope => s === "note.read" || s === "note.write" || s === "note.sync")
      : [];
    if (!userId || !email || scopes.length === 0) return null;
    return { userId, email, scopes };
  } catch {
    return null;
  }
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      const value = rest.join("=").trim();
      return value || null;
    }
  }
  return null;
}

export async function readNoteSession(request: Request): Promise<NoteSession | null> {
  const token = readCookie(request, NOTE_SESSION_COOKIE);
  if (!token) return null;
  return verifyNoteSessionToken(token);
}

export function hasScope(session: NoteSession, scope: NoteScope): boolean {
  return session.scopes.includes(scope);
}

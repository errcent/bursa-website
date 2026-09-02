import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { jsonError } from "@/lib/api-utils";
import { verifyWebSessionToken } from "@/lib/auth/web-session";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session.constants";
import {
  hasScope,
  NOTE_SESSION_COOKIE,
  readNoteSession,
  signNoteSessionToken,
  noteSessionCookieOptions,
} from "@/lib/note/session";
import type { NoteScope, NoteSession } from "@/lib/note/types";
import { hostRole, isProductionHostRouting, NOTE_HOST } from "@/lib/hosts/hosts";

export const NOTE_ALLOWED_ORIGINS = new Set([
  `https://${NOTE_HOST}`,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

export function applyNoteCors(response: NextResponse, origin: string | null): NextResponse {
  if (origin && NOTE_ALLOWED_ORIGINS.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Vary", "Origin");
  }
  return response;
}

export function noteCorsPreflight(origin: string | null): NextResponse {
  return applyNoteCors(new NextResponse(null, { status: 204 }), origin);
}

export function isNoteApiAllowedOnHost(request: NextRequest, pathname: string): boolean {
  if (!isProductionHostRouting()) return true;
  const role = hostRole(request.headers.get("host"));
  if (pathname === "/api/note/sso/start" || pathname.startsWith("/api/note/sso/start?")) {
    return role === "apex" || role === "note";
  }
  return role === "note";
}

export async function requireNoteSession(
  request: NextRequest,
  scope: NoteScope
): Promise<{ session: NoteSession } | { error: NextResponse }> {
  if (!isNoteApiAllowedOnHost(request, request.nextUrl.pathname)) {
    return { error: jsonError("Not found", 404) };
  }

  const note = await readNoteSession(request);
  if (note && hasScope(note, scope)) {
    return { session: note };
  }

  if (!isProductionHostRouting()) {
    const webToken = request.cookies.get(WEB_SESSION_COOKIE)?.value;
    if (webToken) {
      const web = await verifyWebSessionToken(webToken);
      if (web) {
        return { session: { userId: web.userId, email: web.email, scopes: ["note.read", "note.write"] } };
      }
    }
  }

  return { error: jsonError("Sesi Note diperlukan.", 401) };
}

export async function bootstrapLocalNoteCookie(userId: string, email: string) {
  if (isProductionHostRouting()) return;
  const jar = await cookies();
  if (jar.get(NOTE_SESSION_COOKIE)?.value) return;
  const token = await signNoteSessionToken({ id: userId, email });
  jar.set(NOTE_SESSION_COOKIE, token, noteSessionCookieOptions());
}

export function noteHostHref(pathname: string): string {
  if (isProductionHostRouting()) {
    const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
    return `https://${NOTE_HOST}${path.startsWith("/note") ? path : `/note${path}`}`;
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

import { NextRequest, NextResponse } from "next/server";

import { jsonError, jsonOk } from "@/lib/api-utils";
import { applyNoteCors, isNoteApiAllowedOnHost, noteCorsPreflight } from "@/lib/note/guard";
import { consumeNoteSsoCode } from "@/lib/note/sso";
import { noteSessionCookieOptions, signNoteSessionToken } from "@/lib/note/session";

export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!isNoteApiAllowedOnHost(request, request.nextUrl.pathname)) {
    return applyNoteCors(jsonError("Not found", 404), origin);
  }

  const body = (await request.json().catch(() => null)) as { code?: string } | null;
  const code = body?.code?.trim();
  if (!code) {
    return applyNoteCors(jsonError("Kode SSO wajib.", 400), origin);
  }

  const record = await consumeNoteSsoCode(code);
  if (!record) {
    return applyNoteCors(jsonError("Kode SSO tidak valid atau kedaluwarsa.", 401), origin);
  }

  const token = await signNoteSessionToken({ id: record.apexUserId, email: record.email });
  const response = jsonOk({ ok: true });
  response.cookies.set("bursa_note_session", token, noteSessionCookieOptions());
  return applyNoteCors(response, origin);
}

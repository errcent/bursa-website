import { NextRequest, NextResponse } from "next/server";

import { jsonError } from "@/lib/api-utils";
import { verifyWebSessionToken } from "@/lib/auth/web-session";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session.constants";
import { NOTE_HOST, hostRole, isProductionHostRouting } from "@/lib/hosts/hosts";
import { issueNoteSsoCode } from "@/lib/note/sso";
import { noteApexLoginHref, noteSsoStartHref, sanitizeNoteNext } from "@/lib/note/sso-urls";

export async function GET(request: NextRequest) {
  const next = sanitizeNoteNext(request.nextUrl.searchParams.get("next"));

  if (isProductionHostRouting() && hostRole(request.headers.get("host")) === "note") {
    return NextResponse.redirect(noteSsoStartHref(next), 302);
  }

  const token = request.cookies.get(WEB_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(noteApexLoginHref(next), 302);
  }

  const web = await verifyWebSessionToken(token);
  if (!web) {
    return NextResponse.redirect(noteApexLoginHref(next), 302);
  }

  const code = await issueNoteSsoCode(web.userId, web.email);
  const dest = `/note/sso?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`;

  if (isProductionHostRouting()) {
    return NextResponse.redirect(`https://${NOTE_HOST}${dest}`, 302);
  }

  return NextResponse.redirect(new URL(dest, request.url));
}

export async function POST() {
  return jsonError("Gunakan GET untuk memulai SSO Note.", 405);
}

import { NextRequest, NextResponse } from "next/server";

import { jsonError } from "@/lib/api-utils";
import { verifyWebSessionToken } from "@/lib/auth/web-session";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session.constants";
import { NOTE_HOST, isProductionHostRouting } from "@/lib/hosts/hosts";
import { issueNoteSsoCode } from "@/lib/note/sso";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(WEB_SESSION_COOKIE)?.value;
  const next = request.nextUrl.searchParams.get("next") || "/note";

  if (!token) {
    const login = new URL("/masuk", request.url);
    login.searchParams.set("next", `/api/note/sso/start?next=${encodeURIComponent(next)}`);
    return NextResponse.redirect(login);
  }

  const web = await verifyWebSessionToken(token);
  if (!web) {
    const login = new URL("/masuk", request.url);
    login.searchParams.set("next", `/api/note/sso/start?next=${encodeURIComponent(next)}`);
    return NextResponse.redirect(login);
  }

  const code = await issueNoteSsoCode(web.userId, web.email);
  const destPath = `/note/sso?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`;

  if (isProductionHostRouting()) {
    return NextResponse.redirect(
      `https://${NOTE_HOST}/note/sso?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`,
      302
    );
  }

  return NextResponse.redirect(new URL(destPath, request.url));
}

export async function POST() {
  return jsonError("Gunakan GET untuk memulai SSO Note.", 405);
}

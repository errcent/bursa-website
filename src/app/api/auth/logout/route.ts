import { jsonOk } from "@/lib/api-utils";
import {
  WEB_SESSION_COOKIE,
  webSessionCookieOptions,
} from "@/lib/auth/web-session";

export async function POST() {
  const response = jsonOk({ ok: true });
  response.cookies.set(WEB_SESSION_COOKIE, "", { ...webSessionCookieOptions(), maxAge: 0 });
  return response;
}

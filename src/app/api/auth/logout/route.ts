import { jsonOk } from "@/lib/api-utils";
import { revokeWebSessionJti } from "@/lib/auth/revoked-web-session";
import {
  WEB_SESSION_COOKIE,
  readWebSessionPayload,
  readWebSessionToken,
  webSessionCookieOptions,
} from "@/lib/auth/web-session";

const AUTH_SESSION_COOKIES = [
  WEB_SESSION_COOKIE,
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "__Host-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "__Host-next-auth.session-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
] as const;

export async function POST(request: Request) {
  const token = readWebSessionToken(request);
  if (token) {
    const payload = await readWebSessionPayload(token);
    if (payload) {
      try {
        await revokeWebSessionJti(payload.jti, new Date(payload.exp * 1000));
      } catch (error) {
        console.error("[logout] revoke failed:", error);
      }
    }
  }

  const response = jsonOk({ ok: true });
  const cookieOptions = { ...webSessionCookieOptions(), maxAge: 0 };
  for (const name of AUTH_SESSION_COOKIES) {
    response.cookies.set(name, "", cookieOptions);
  }
  return response;
}

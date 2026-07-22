import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { findUserByIdentifier, verifyPassword } from "@/lib/auth/server";
import { checkRateLimit, clientIp } from "@/lib/auth/rate-limit";
import {
  signWebSessionToken,
  webSessionCookieOptions,
  WEB_SESSION_COOKIE,
} from "@/lib/auth/web-session";
import { loginSchema } from "@/lib/auth/validation";

/** Generic login failure — do not reveal whether identifier exists (OWASP A07). */
const GENERIC_LOGIN_ERROR = "Email, username, atau kata sandi salah.";

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const rate = checkRateLimit(`login:${ip}`, 5, 60 * 1000);
    if (!rate.allowed) {
      return jsonError(
        `Terlalu banyak percobaan masuk. Coba lagi dalam ${rate.retryAfterSec} detik.`,
        429
      );
    }

    const body = loginSchema.parse(await request.json());
    const user = await findUserByIdentifier(body.identifier);

    if (!user) {
      return jsonError(GENERIC_LOGIN_ERROR, 401);
    }

    const valid = await verifyPassword(user, body.password);
    if (!valid) {
      return jsonError(GENERIC_LOGIN_ERROR, 401);
    }

    const token = await signWebSessionToken({ id: user.id, email: user.email });
    const response = jsonOk({
      user: {
        id: user.id,
        email: user.email,
        name: user.nama,
        username: user.username,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      },
    });
    response.cookies.set(WEB_SESSION_COOKIE, token, webSessionCookieOptions());
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

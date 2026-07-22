import { cookies } from "next/headers";

import { jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import {
  verifyWebSessionToken,
  WEB_SESSION_COOKIE,
} from "@/lib/auth/web-session";

function toClientRole(role: string) {
  if (role === "ADMIN") return "admin";
  if (role === "MENTOR") return "mentor";
  if (role === "DEVELOPER") return "developer";
  return "learner";
}

/** Restore client session from password-login web session cookie. */
export async function GET() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!rawToken) {
    return jsonError("Sesi web tidak ditemukan.", 401);
  }

  const verified = await verifyWebSessionToken(rawToken);
  if (!verified) {
    return jsonError("Sesi web tidak valid.", 401);
  }

  const user = await db.user.findUnique({
    where: { id: verified.userId },
    select: {
      id: true,
      email: true,
      nama: true,
      username: true,
      phone: true,
      bio: true,
      avatarUrl: true,
      role: true,
    },
  });

  if (!user) {
    return jsonError("Pengguna tidak ditemukan.", 404);
  }

  return jsonOk({
    user: {
      id: user.id,
      email: user.email,
      name: user.nama,
      username: user.username,
      phone: user.phone,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      role: toClientRole(user.role),
    },
    provider: "web_session" as const,
  });
}

import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import {
  signWebSessionToken,
  WEB_SESSION_COOKIE,
  webSessionCookieOptions,
} from "@/lib/auth/web-session";

/**
 * Returns the active NextAuth (Google) session for client-side bridge into
 * localStorage auth — keeps existing prototype APIs working during migration.
 * Requires a valid NextAuth session cookie (set only after OAuth CSRF-validated flow).
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return jsonError("Sesi OAuth tidak ditemukan.", 401);
  }

  const email = session.user.email.trim().toLowerCase();
  const dbUser = await db.user.findUnique({ where: { email } });

  const prismaRole = dbUser?.role ?? "LEARNER";
  const clientRole =
    prismaRole === "ADMIN"
      ? "admin"
      : prismaRole === "MENTOR"
        ? "mentor"
        : prismaRole === "DEVELOPER"
          ? "developer"
          : "learner";

  const userId = dbUser?.id ?? email;

  const response = jsonOk({
    user: {
      id: userId,
      email,
      // DB is source of truth for existing accounts; Google fills gaps for new users.
      name: dbUser?.nama ?? session.user.name ?? email.split("@")[0],
      username: dbUser?.username ?? null,
      phone: dbUser?.phone ?? null,
      bio: dbUser?.bio ?? null,
      avatarUrl: dbUser?.avatarUrl ?? session.user.image ?? null,
      role: clientRole,
    },
    provider: "google" as const,
  });

  if (dbUser) {
    const token = await signWebSessionToken({ id: dbUser.id, email: dbUser.email });
    response.cookies.set(WEB_SESSION_COOKIE, token, webSessionCookieOptions());
  }

  return response;
}

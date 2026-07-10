import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";

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

  return jsonOk({
    user: {
      id: dbUser?.id ?? email,
      email,
      name: session.user.name ?? dbUser?.nama ?? email.split("@")[0],
      avatarUrl: session.user.image ?? dbUser?.avatarUrl ?? null,
      role: clientRole,
    },
    provider: "google" as const,
  });
}

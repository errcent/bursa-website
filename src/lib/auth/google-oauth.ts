import type { UserRole } from "@prisma/client";

import { db } from "@/lib/db";

const OAUTH_PASSWORD_MARKER = "oauth-google";

/** True when Google OAuth can run (env present). Safe to call at build time. */
export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim() &&
      getAuthSecret()
  );
}

/** NextAuth v5 accepts AUTH_SECRET; we also support NEXTAUTH_SECRET for ops docs. */
export function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "bursa-build-placeholder-secret-not-for-production"
  );
}

function mapClientRole(email: string, roleHint?: string): UserRole {
  const normalized = roleHint?.toLowerCase();
  if (normalized === "admin" || email === "admin@test.dev") return "ADMIN";
  if (normalized === "developer" || email === "developer@test.dev" || email.endsWith("@dev.bursa.dev")) {
    return "DEVELOPER";
  }
  if (normalized === "mentor" || email === "mentor@test.dev" || email.endsWith("@mentor.bursa.dev")) {
    return "MENTOR";
  }
  return "LEARNER";
}

/**
 * Create or link a Prisma user after Google OAuth.
 * Data minimization: email, display name, avatar URL only — no Gmail read scope.
 */
export async function upsertGoogleOAuthUser(input: {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  const email = input.email.trim().toLowerCase();
  const nama = input.name?.trim() || email.split("@")[0] || "Pengguna";

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    const updates: { nama?: string; avatarUrl?: string | null } = {};
    if (nama && existing.nama !== nama) updates.nama = nama;
    if (input.avatarUrl && existing.avatarUrl !== input.avatarUrl) {
      updates.avatarUrl = input.avatarUrl;
    }
    if (Object.keys(updates).length === 0) return existing;
    return db.user.update({ where: { id: existing.id }, data: updates });
  }

  return db.user.create({
    data: {
      email,
      nama,
      avatarUrl: input.avatarUrl ?? null,
      passwordHash: OAUTH_PASSWORD_MARKER,
      role: mapClientRole(email),
    },
  });
}

export { OAUTH_PASSWORD_MARKER };

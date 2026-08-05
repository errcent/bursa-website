import type { UserRole } from "@prisma/client";

import { getAuthSecret } from "@/lib/auth/auth-secret";
import { db } from "@/lib/db";
import { markWaitlistConverted } from "@/lib/waitlist/resend";

export { getAuthSecret };

const OAUTH_PASSWORD_MARKER = "oauth-google";

/** True when Google OAuth can run (env present). Safe to call at build time. */
export function isGoogleOAuthConfigured(): boolean {
  const hasGoogle =
    Boolean(process.env.GOOGLE_CLIENT_ID?.trim()) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim());
  if (!hasGoogle) return false;

  const hasSecret = Boolean(
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim()
  );
  if (process.env.NODE_ENV === "production" && !hasSecret) return false;

  try {
    return Boolean(getAuthSecret());
  } catch {
    return false;
  }
}

function mapClientRole(_email: string, roleHint?: string): UserRole {
  const normalized = roleHint?.toLowerCase();
  if (process.env.NODE_ENV !== "production") {
    if (normalized === "admin") return "ADMIN";
    if (normalized === "developer") return "DEVELOPER";
    if (normalized === "mentor") return "MENTOR";
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
}): Promise<{ user: Awaited<ReturnType<typeof db.user.create>>; isNew: boolean }> {
  const email = input.email.trim().toLowerCase();
  const nama = input.name?.trim() || email.split("@")[0] || "Pengguna";

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    const isOAuthOnly = existing.passwordHash === OAUTH_PASSWORD_MARKER;
    const updates: {
      nama?: string;
      avatarUrl?: string | null;
      emailVerifiedAt?: Date;
    } = {};
    // Never overwrite mentor/staff profile fields from Google on password-backed accounts.
    if (isOAuthOnly) {
      if (nama && existing.nama !== nama) updates.nama = nama;
      if (input.avatarUrl && existing.avatarUrl !== input.avatarUrl) {
        updates.avatarUrl = input.avatarUrl;
      }
    }
    if (!existing.emailVerifiedAt) {
      updates.emailVerifiedAt = new Date();
    }
    if (Object.keys(updates).length === 0) {
      await markWaitlistConverted(email);
      return { user: existing, isNew: false };
    }
    const user = await db.user.update({ where: { id: existing.id }, data: updates });
    await markWaitlistConverted(email);
    return { user, isNew: false };
  }

  const user = await db.user.create({
    data: {
      email,
      nama,
      avatarUrl: input.avatarUrl ?? null,
      passwordHash: OAUTH_PASSWORD_MARKER,
      role: mapClientRole(email),
      emailVerifiedAt: new Date(),
    },
  });

  await markWaitlistConverted(email);
  return { user, isNew: true };
}

export { OAUTH_PASSWORD_MARKER };

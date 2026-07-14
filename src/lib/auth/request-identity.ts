import type { User } from "@prisma/client";

import { auth } from "@/auth";

import { isPrototypeMode } from "@/lib/auth/prototype";
import { resolveRequestUser } from "@/lib/lesson-qa/server";

/**
 * Resolve a trusted caller email for privileged API routes.
 * Production: NextAuth session cookie only.
 * Prototype: falls back to x-user-email (localStorage bridge).
 */
export async function resolveTrustedEmail(request: Request): Promise<string | null> {
  const session = await auth();
  const sessionEmail = session?.user?.email?.trim().toLowerCase();
  if (sessionEmail) return sessionEmail;

  if (!isPrototypeMode()) return null;

  return request.headers.get("x-user-email")?.trim().toLowerCase() ?? null;
}

/**
 * Resolve the authenticated Prisma user from a trusted session only.
 * Rejects userId-only spoofing — email must come from NextAuth or prototype bridge.
 */
export async function resolveAuthenticatedUser(
  request: Request,
  options?: { createIfMissing?: boolean; claimedUserId?: string | null }
): Promise<User | null> {
  const email = await resolveTrustedEmail(request);
  if (!email) return null;

  const user = await resolveRequestUser(
    { userId: "", email },
    { createIfMissing: options?.createIfMissing ?? false }
  );
  if (!user) return null;

  const claimed = options?.claimedUserId?.trim();
  if (claimed && claimed !== user.id) return null;

  return user;
}

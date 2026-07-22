import type { User } from "@prisma/client";

import { auth } from "@/auth";

import { resolveMobileJwtEmail } from "@/lib/auth/mobile-request";
import {
  readWebSessionToken,
  verifyWebSessionToken,
} from "@/lib/auth/web-session";
import { resolveRequestUser } from "@/lib/lesson-qa/server";

/**
 * Resolve a trusted caller email for privileged API routes.
 * Production: web session cookie (credential login) > mobile JWT > NextAuth (Google).
 * Prototype dev: falls back to x-user-email (localStorage bridge).
 */
export async function resolveTrustedEmail(request: Request): Promise<string | null> {
  const webToken = readWebSessionToken(request);
  if (webToken) {
    const webSession = await verifyWebSessionToken(webToken);
    if (webSession) return webSession.email;
  }

  const mobileEmail = await resolveMobileJwtEmail(request);
  if (mobileEmail) return mobileEmail;

  const session = await auth();
  const sessionEmail = session?.user?.email?.trim().toLowerCase();
  if (sessionEmail) return sessionEmail;

  if (process.env.NODE_ENV !== "development") return null;

  return request.headers.get("x-user-email")?.trim().toLowerCase() ?? null;
}

/**
 * Resolve the authenticated Prisma user from a trusted session only.
 * Rejects userId-only spoofing — email must come from NextAuth or prototype bridge.
 */
export async function resolveAuthenticatedUser(
  request: Request,
  options?: {
    createIfMissing?: boolean;
    claimedUserId?: string | null;
    name?: string;
    role?: string;
    username?: string;
    phone?: string;
  }
): Promise<User | null> {
  const email = await resolveTrustedEmail(request);
  if (!email) return null;

  const user = await resolveRequestUser(
    {
      userId: "",
      email,
      name: options?.name,
      role: options?.role,
      username: options?.username,
      phone: options?.phone,
    },
    { createIfMissing: options?.createIfMissing ?? false }
  );
  if (!user) return null;

  return user;
}

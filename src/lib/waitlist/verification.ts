import { createHash, randomBytes } from "crypto";

import { db } from "@/lib/db";

/** Verification link valid for 48 hours. */
export const WAITLIST_VERIFY_TTL_MS = 48 * 60 * 60 * 1000;

export function hashWaitlistVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateWaitlistVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export async function issueWaitlistVerificationToken(email: string): Promise<string> {
  const token = generateWaitlistVerificationToken();
  const tokenHash = hashWaitlistVerificationToken(token);
  const expiresAt = new Date(Date.now() + WAITLIST_VERIFY_TTL_MS);

  await db.waitlistEntry.update({
    where: { email },
    data: {
      verificationTokenHash: tokenHash,
      verificationExpiresAt: expiresAt,
    },
  });

  return token;
}

export async function verifyWaitlistEmail(token: string) {
  const tokenHash = hashWaitlistVerificationToken(token);
  const entry = await db.waitlistEntry.findUnique({
    where: { verificationTokenHash: tokenHash },
  });

  if (!entry) {
    return { valid: false as const, reason: "invalid" as const };
  }

  if (entry.emailVerifiedAt) {
    return { valid: true as const, alreadyVerified: true as const, email: entry.email };
  }

  if (!entry.verificationExpiresAt || entry.verificationExpiresAt.getTime() < Date.now()) {
    return { valid: false as const, reason: "expired" as const };
  }

  await db.waitlistEntry.update({
    where: { id: entry.id },
    data: {
      emailVerifiedAt: new Date(),
      verificationTokenHash: null,
      verificationExpiresAt: null,
    },
  });

  return { valid: true as const, alreadyVerified: false as const, email: entry.email };
}

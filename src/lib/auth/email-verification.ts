import { createHash, randomBytes } from "crypto";

import { db } from "@/lib/db";

/** Verification link valid for 24 hours. */
export const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

export function hashEmailVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateEmailVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createEmailVerificationToken(userId: string): Promise<string> {
  const token = generateEmailVerificationToken();
  const tokenHash = hashEmailVerificationToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TTL_MS);

  await db.emailVerificationToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  await db.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return token;
}

export async function verifyUserEmail(token: string) {
  const tokenHash = hashEmailVerificationToken(token);
  const record = await db.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true, emailVerifiedAt: true } } },
  });

  if (!record || record.usedAt) {
    return { valid: false as const, reason: "invalid" as const };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    return { valid: false as const, reason: "expired" as const };
  }

  if (record.user.emailVerifiedAt) {
    await db.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return {
      valid: true as const,
      alreadyVerified: true as const,
      email: record.user.email,
    };
  }

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    db.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return {
    valid: true as const,
    alreadyVerified: false as const,
    email: record.user.email,
  };
}

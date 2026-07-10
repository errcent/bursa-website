import { createHash, randomBytes } from "crypto";

import bcrypt from "bcryptjs";

import { db } from "@/lib/db";

/** Token valid for 30 minutes (within 15–60 min security guideline). */
export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = generateResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  // Invalidate previous unused tokens for this user.
  await db.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  await db.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return token;
}

export async function validateResetToken(token: string) {
  const tokenHash = hashResetToken(token);
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!record || record.usedAt) {
    return { valid: false as const, reason: "invalid" as const };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    return { valid: false as const, reason: "expired" as const };
  }

  return {
    valid: true as const,
    record,
    email: record.user.email,
  };
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  const validation = await validateResetToken(token);
  if (!validation.valid) {
    return validation;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await db.$transaction([
    db.user.update({
      where: { id: validation.record.userId },
      data: { passwordHash },
    }),
    db.passwordResetToken.update({
      where: { id: validation.record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return {
    valid: true as const,
    email: validation.email,
  };
}

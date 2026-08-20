import { createHash, randomBytes } from "crypto";

import { L2_TOKEN_TTL_DAYS } from "@/lib/mentor-program/fields";

export function generateL2Token(): string {
  return randomBytes(32).toString("hex");
}

export function hashL2Token(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function l2TokenExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + L2_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function isL2TokenExpired(expiresAt: Date | null | undefined, now = new Date()): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() < now.getTime();
}

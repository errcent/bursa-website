import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";

import { OAUTH_PASSWORD_MARKER } from "./google-oauth";
import {
  classifyLoginIdentifier,
  normalizeLoginIdentifier,
} from "./validation";

/** Non-bcrypt markers — OAuth-only and client-auth bridge accounts cannot password-login. */
const NON_PASSWORD_MARKERS = new Set(["client-auth-bridge", OAUTH_PASSWORD_MARKER]);

/** Find a user by username, email, or phone (E.164 / Indonesian). */
export async function findUserByIdentifier(identifier: string): Promise<User | null> {
  const kind = classifyLoginIdentifier(identifier);
  const normalized = normalizeLoginIdentifier(identifier);

  if (kind === "email") {
    return db.user.findUnique({ where: { email: normalized } });
  }
  if (kind === "phone") {
    return db.user.findUnique({ where: { phone: normalized } });
  }
  return db.user.findUnique({ where: { username: normalized } });
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  // Reject before bcrypt.compare — marker strings are not valid bcrypt hashes.
  if (NON_PASSWORD_MARKERS.has(user.passwordHash)) return false;
  return bcrypt.compare(password, user.passwordHash);
}

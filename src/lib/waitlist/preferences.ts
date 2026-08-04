import { createHmac, timingSafeEqual } from "crypto";

import { getSiteUrl } from "@/lib/email/escape";

const SIGNING_VERSION = "v1";

function getSigningSecret(): string {
  const secret =
    process.env.WAITLIST_PREFERENCES_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();

  if (!secret) {
    throw new Error("WAITLIST_PREFERENCES_SECRET atau auth secret belum dikonfigurasi.");
  }

  return secret;
}

function signatureFor(entryId: string): string {
  return createHmac("sha256", getSigningSecret())
    .update(`${SIGNING_VERSION}:${entryId}`)
    .digest("base64url");
}

export function createPreferenceSignature(entryId: string): string {
  return signatureFor(entryId);
}

export function verifyPreferenceSignature(entryId: string, signature: string): boolean {
  if (!entryId || !signature) return false;

  const expected = Buffer.from(signatureFor(entryId));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function getWaitlistPreferencesUrl(entryId: string): string {
  const query = new URLSearchParams({
    id: entryId,
    sig: createPreferenceSignature(entryId),
  });
  return `${getSiteUrl()}/email-preferences?${query.toString()}`;
}

export function getWaitlistUnsubscribeUrl(entryId: string): string {
  const query = new URLSearchParams({
    id: entryId,
    sig: createPreferenceSignature(entryId),
  });
  return `${getSiteUrl()}/api/waitlist/unsubscribe?${query.toString()}`;
}


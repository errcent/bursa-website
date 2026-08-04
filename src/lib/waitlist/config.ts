import { createHash } from "crypto";

export const WAITLIST_CONSENT_VERSION = "waitlist-v2";
export const WAITLIST_CONSENT_PURPOSE = "waitlist_lifecycle_updates";
export const WAITLIST_AUTOMATION_EVENT = "waitlist.joined";

export const WAITLIST_FREQUENCY_LIMITS = {
  perDay: 1,
  perSevenDays: 2,
} as const;

export function isWithinWaitlistFrequencyCap(lastDay: number, lastSevenDays: number): boolean {
  return (
    lastDay < WAITLIST_FREQUENCY_LIMITS.perDay &&
    lastSevenDays < WAITLIST_FREQUENCY_LIMITS.perSevenDays
  );
}

export function isWaitlistLifecycleEnabled(): boolean {
  const value = process.env.WAITLIST_LIFECYCLE_ENABLED?.trim().toLowerCase();
  return value === "true" || value === "1";
}

export function isWaitlistLifecycleApprovedByEnv(): boolean {
  const value = process.env.WAITLIST_LIFECYCLE_APPROVED?.trim().toLowerCase();
  return value === "true" || value === "1";
}

export function getWaitlistLifecycleRolloutPercent(): number {
  const parsed = Number(process.env.WAITLIST_LIFECYCLE_ROLLOUT_PERCENT ?? "0");
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0;
}

export function isWaitlistLifecycleEligible(entryId: string, email: string): boolean {
  const internal = new Set(
    (process.env.WAITLIST_INTERNAL_COHORT ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
  if (internal.has(email.toLowerCase())) return true;

  const percent = getWaitlistLifecycleRolloutPercent();
  if (percent <= 0) return false;
  if (percent >= 100) return true;

  const bucket = Number.parseInt(createHash("sha256").update(entryId).digest("hex").slice(0, 8), 16);
  return bucket % 10_000 < percent * 100;
}

export function getWaitlistReplyTo(): string | undefined {
  return process.env.WAITLIST_REPLY_TO?.trim() || undefined;
}

export function getWaitlistMarketingFrom(): string | undefined {
  return process.env.WAITLIST_EMAIL_FROM?.trim() || undefined;
}


/**
 * Soft-launch / Decision OS public surface rules.
 * Sync with Research `data/gates.yaml` phases P0–P1.
 * Do NOT treat these as calibrated market locks.
 * Honesty pricing stays in Decision OS / internal docs - not a public /harga page.
 */
export const SOFT_LAUNCH = {
  /** Max courses shown as featured / primary public catalog surface */
  maxPublicCourses: 4,
  /** Public list prices not locked - announce at official launch only */
  publicListLocked: false,
  /** Rising-price urgency forbidden until G-URGENCY */
  urgencyAllowed: false,
  /** Paid checkout still env-gated; Decision OS also requires G-SUPPLY */
  decisionOsNote:
    "Harga final belum dikunci data. Gunakan Decision OS internal (research.decision_os), bukan surface publik.",
  experimentArmsIdr: [750_000, 1_999_000, 2_499_000] as const,
} as const;

export function capSoftLaunchCourses<T>(courses: T[]): T[] {
  return courses.slice(0, SOFT_LAUNCH.maxPublicCourses);
}

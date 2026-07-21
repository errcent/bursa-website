import type { Course, Mentor } from "@/lib/types";

/**
 * Composite, NON-PRICE quality ranking for catalog courses.
 *
 * Rationale (Game Theory audit QC-20260719-02): sorting/discovery by price is
 * the trigger for a Bertrand-style race-to-bottom. Because marginal cost of a
 * digital course ≈ 0 and courses are only weakly differentiated within a niche,
 * a price-based default sort pushes rational mentors to undercut each other.
 * Ranking on quality signals instead removes that trigger while keeping the
 * LOCKED business model intact (mentor-set price, 25% commission, lifetime
 * access). Price MUST NOT enter this score.
 *
 * Hardening (QC-20260719-17/18/27/37/43):
 *  - Rating uses the Bayesian-shrunk value (low-n reviews cannot spike a course).
 *  - Popularity uses distinct PAID buyers (free/Sybil enrollments do not move it).
 *  - A time-bounded cold-start exploration term gives new/low-signal courses a
 *    finite chance to earn impressions (mitigates the Matthew effect).
 *  - A staleness penalty down-weights content that has not been refreshed, so a
 *    historical 5★ does not shield abandoned material (moral-hazard QC-19-01/18).
 */

const RATING_WEIGHT = 0.4;
const POPULARITY_WEIGHT = 0.2;
const MENTOR_TRUST_WEIGHT = 0.25;
const EXPLORATION_WEIGHT = 0.15;

/** Paid-buyer count that maps to a "fully popular" (1.0) popularity signal. */
const POPULARITY_CEIL = 5_000;
const MAX_RATING = 5;

/** Cold-start window (days) during which a new course still receives exploration weight. */
const COLD_START_DAYS = 45;
/** Review count at/above which a course is considered to have an established signal. */
const ESTABLISHED_RATING_COUNT = 12;
/** Content older than this (days) starts to incur a staleness penalty. */
const STALENESS_GRACE_DAYS = 365;
/** Maximum multiplicative staleness penalty (score retains at least this fraction). */
const MIN_STALENESS_FACTOR = 0.75;

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function popularityNorm(paidStudents: number): number {
  const safe = Math.max(0, paidStudents);
  return clamp01(Math.log10(1 + safe) / Math.log10(1 + POPULARITY_CEIL));
}

function trackRecordNorm(trackRecord: number[]): number {
  if (!trackRecord || trackRecord.length === 0) return 0;
  const avg = trackRecord.reduce((sum, v) => sum + v, 0) / trackRecord.length;
  return clamp01(avg / 100);
}

function mentorTrustNorm(mentor: Mentor | null | undefined): number {
  if (!mentor) return 0;
  const verified = mentor.verified ? 1 : 0;
  const reputation = clamp01(mentor.rating / MAX_RATING);
  const track = trackRecordNorm(mentor.trackRecord);
  return clamp01(0.45 * verified + 0.4 * reputation + 0.15 * track);
}

function daysSince(iso: string | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, (Date.now() - t) / (24 * 60 * 60 * 1000));
}

/** Epsilon-exploration: decays over the cold-start window and with accumulated reviews. */
function explorationTerm(course: Course): number {
  const ratingCount = course.ratingCount ?? 0;
  const ageDays = daysSince(course.createdAt);
  const signalFactor = clamp01(1 - ratingCount / ESTABLISHED_RATING_COUNT);
  const ageFactor =
    ageDays === null ? 0 : clamp01(1 - ageDays / COLD_START_DAYS);
  // A course still gets exploration weight while it is either young OR under-reviewed.
  return clamp01(Math.max(ageFactor, 0.5 * signalFactor));
}

/** Staleness multiplier in [MIN_STALENESS_FACTOR, 1] based on last content refresh. */
function stalenessFactor(course: Course): number {
  const ageDays = daysSince(course.contentUpdatedAt ?? course.createdAt);
  if (ageDays === null || ageDays <= STALENESS_GRACE_DAYS) return 1;
  const over = ageDays - STALENESS_GRACE_DAYS;
  const penalty = clamp01(over / STALENESS_GRACE_DAYS) * (1 - MIN_STALENESS_FACTOR);
  return 1 - penalty;
}

/**
 * Returns a 0..1 quality score for a course. Higher = ranked earlier.
 * Deliberately ignores `course.price`.
 */
export function courseQualityScore(course: Course, mentor?: Mentor | null): number {
  const ratingSignal = course.bayesianRating ?? course.rating;
  const rating = clamp01(ratingSignal / MAX_RATING);
  const popularity = popularityNorm(course.paidStudentsCount ?? course.studentsCount);
  const mentorTrust = mentorTrustNorm(mentor);
  const exploration = explorationTerm(course);

  const base =
    RATING_WEIGHT * rating +
    POPULARITY_WEIGHT * popularity +
    MENTOR_TRUST_WEIGHT * mentorTrust +
    EXPLORATION_WEIGHT * exploration;

  return base * stalenessFactor(course);
}

/**
 * Stable, quality-first ordering of courses. Ties break by paid adoption then title
 * so the sort is deterministic. Never sorts by price.
 */
export function rankCoursesByQuality(
  courses: Course[],
  mentorBySlug: Map<string, Mentor>
): Course[] {
  return [...courses]
    .map((course) => ({
      course,
      score: courseQualityScore(course, mentorBySlug.get(course.mentorSlug)),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aPaid = a.course.paidStudentsCount ?? a.course.studentsCount;
      const bPaid = b.course.paidStudentsCount ?? b.course.studentsCount;
      if (bPaid !== aPaid) return bPaid - aPaid;
      return a.course.title.localeCompare(b.course.title, "id-ID");
    })
    .map((entry) => entry.course);
}

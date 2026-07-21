import { revalidatePath, revalidateTag } from "next/cache";

import { db } from "@/lib/db";

/** Bayesian prior weight (min-sample). Low-n ratings are pulled toward the platform mean. */
const BAYES_PRIOR_WEIGHT = 8;
/** Fallback platform mean when there are no reviews yet. */
const DEFAULT_PLATFORM_MEAN = 4.2;
/** Recency half-life (days) for the time-decayed rating (QC-20260719-18/01). */
const RATING_HALF_LIFE_DAYS = 240;

export interface CourseStats {
  rating: number;
  ratingCount: number;
  bayesianRating: number;
  decayedRating: number;
  studentsCount: number;
  paidStudentsCount: number;
}

export interface MentorStats {
  rating: number;
  studentsCount: number;
  paidStudentsCount: number;
  coursesCount: number;
}

async function platformMeanRating(): Promise<number> {
  const agg = await db.review.aggregate({
    where: { isFlagged: false },
    _avg: { rating: true },
    _count: { _all: true },
  });
  if (!agg._count._all) return DEFAULT_PLATFORM_MEAN;
  return agg._avg.rating ?? DEFAULT_PLATFORM_MEAN;
}

function bayesianAverage(sum: number, count: number, prior: number): number {
  return (BAYES_PRIOR_WEIGHT * prior + sum) / (BAYES_PRIOR_WEIGHT + count);
}

function decayedAverage(
  reviews: Array<{ rating: number; createdAt: Date }>,
  now = Date.now()
): number {
  if (reviews.length === 0) return 0;
  let weightedSum = 0;
  let weightTotal = 0;
  for (const r of reviews) {
    const ageDays = Math.max(0, (now - r.createdAt.getTime()) / (24 * 60 * 60 * 1000));
    const weight = Math.pow(0.5, ageDays / RATING_HALF_LIFE_DAYS);
    weightedSum += weight * r.rating;
    weightTotal += weight;
  }
  return weightTotal > 0 ? weightedSum / weightTotal : 0;
}

/** Count distinct learners with a COMPLETED paid transaction for a course (QC-20260719-27). */
async function countPaidBuyers(courseId: string): Promise<number> {
  const rows = await db.transaction.findMany({
    where: { courseId, status: "COMPLETED", amount: { gt: 0 } },
    select: { userId: true },
    distinct: ["userId"],
  });
  return rows.length;
}

/**
 * Course rating aggregates. Excludes flagged (reciprocal-ring / mentor-affiliated) reviews
 * from public aggregates (QC-20260719-34). Exposes n, Bayesian-shrunk and time-decayed
 * ratings for ranking that resists low-n gaming and staleness (QC-20260719-17/18).
 */
export async function getCourseStats(courseId: string): Promise<CourseStats> {
  const [reviews, studentsCount, paidStudentsCount, prior] = await Promise.all([
    db.review.findMany({
      where: { courseId, isFlagged: false },
      select: { rating: true, createdAt: true },
    }),
    db.enrollment.count({ where: { courseId } }),
    countPaidBuyers(courseId),
    platformMeanRating(),
  ]);

  const ratingCount = reviews.length;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const rating = ratingCount > 0 ? Number((sum / ratingCount).toFixed(1)) : 0;
  const bayesianRating =
    ratingCount > 0 ? Number(bayesianAverage(sum, ratingCount, prior).toFixed(3)) : 0;
  const decayedRating =
    ratingCount > 0 ? Number(decayedAverage(reviews).toFixed(3)) : 0;

  return { rating, ratingCount, bayesianRating, decayedRating, studentsCount, paidStudentsCount };
}

/** Live mentor rating (avg reviews across all courses) and distinct enrolled learners. */
export async function getMentorStats(mentorId: string): Promise<MentorStats> {
  const mentorCourses = await db.course.findMany({
    where: { mentorId },
    select: { id: true },
  });
  const courseIds = mentorCourses.map((c) => c.id);

  if (courseIds.length === 0) {
    return { rating: 0, studentsCount: 0, paidStudentsCount: 0, coursesCount: 0 };
  }

  const [reviewAgg, enrollments, paidBuyers] = await Promise.all([
    db.review.aggregate({
      where: { courseId: { in: courseIds }, isFlagged: false },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    db.enrollment.findMany({
      where: { courseId: { in: courseIds } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    db.transaction.findMany({
      where: { courseId: { in: courseIds }, status: "COMPLETED", amount: { gt: 0 } },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  const rating =
    reviewAgg._count._all > 0 ? Number(reviewAgg._avg.rating?.toFixed(1) ?? 0) : 0;

  return {
    rating,
    studentsCount: enrollments.length,
    paidStudentsCount: paidBuyers.length,
    coursesCount: mentorCourses.length,
  };
}

/** Persist computed course stats to the Course row. */
export async function recalculateCourseStats(courseId: string): Promise<CourseStats> {
  const stats = await getCourseStats(courseId);
  await db.course.update({
    where: { id: courseId },
    data: {
      rating: stats.rating,
      ratingCount: stats.ratingCount,
      bayesianRating: stats.bayesianRating,
      decayedRating: stats.decayedRating,
      studentsCount: stats.studentsCount,
      paidStudentsCount: stats.paidStudentsCount,
      ratingUpdatedAt: new Date(),
    },
  });
  return stats;
}

/** Persist computed mentor stats to the MentorProfile row. */
export async function recalculateMentorStats(mentorId: string): Promise<MentorStats> {
  const stats = await getMentorStats(mentorId);
  await db.mentorProfile.update({
    where: { id: mentorId },
    data: {
      rating: stats.rating,
      studentsCount: stats.studentsCount,
      paidStudentsCount: stats.paidStudentsCount,
      coursesCount: stats.coursesCount,
    },
  });
  return stats;
}

/** Recalculate course + mentor stats and revalidate public pages that show them. */
export async function recalculateStatsForCourse(courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      slug: true,
      mentorId: true,
      mentor: { select: { slug: true } },
    },
  });
  if (!course) return null;

  const [courseStats, mentorStats] = await Promise.all([
    recalculateCourseStats(courseId),
    recalculateMentorStats(course.mentorId),
  ]);

  revalidateStatsPaths({
    courseSlug: course.slug,
    mentorSlug: course.mentor.slug,
  });

  return { courseStats, mentorStats };
}

/** Revalidate catalog, course detail, mentor profile, and home. */
export function revalidateStatsPaths(input: { courseSlug: string; mentorSlug: string }) {
  revalidateTag("catalog", "max");
  revalidatePath("/katalog");
  revalidatePath(`/kelas/${input.courseSlug}`);
  revalidatePath(`/instruktur/${input.mentorSlug}`);
  revalidatePath("/");
}

import { revalidatePath, revalidateTag } from "next/cache";

import { db } from "@/lib/db";

export interface CourseStats {
  rating: number;
  studentsCount: number;
}

export interface MentorStats {
  rating: number;
  studentsCount: number;
  coursesCount: number;
}

/** Live course rating (avg Review.rating) and distinct enrolled learners. */
export async function getCourseStats(courseId: string): Promise<CourseStats> {
  const [reviewAgg, studentsCount] = await Promise.all([
    db.review.aggregate({
      where: { courseId },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    db.enrollment.count({ where: { courseId } }),
  ]);

  const rating =
    reviewAgg._count._all > 0 ? Number(reviewAgg._avg.rating?.toFixed(1) ?? 0) : 0;

  return { rating, studentsCount };
}

/** Live mentor rating (avg reviews across all courses) and distinct enrolled learners. */
export async function getMentorStats(mentorId: string): Promise<MentorStats> {
  const mentorCourses = await db.course.findMany({
    where: { mentorId },
    select: { id: true },
  });
  const courseIds = mentorCourses.map((c) => c.id);

  if (courseIds.length === 0) {
    return { rating: 0, studentsCount: 0, coursesCount: 0 };
  }

  const [reviewAgg, enrollments] = await Promise.all([
    db.review.aggregate({
      where: { courseId: { in: courseIds } },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    db.enrollment.findMany({
      where: { courseId: { in: courseIds } },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  const rating =
    reviewAgg._count._all > 0 ? Number(reviewAgg._avg.rating?.toFixed(1) ?? 0) : 0;

  return {
    rating,
    studentsCount: enrollments.length,
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
      studentsCount: stats.studentsCount,
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

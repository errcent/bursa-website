import { db } from "@/lib/db";
import type {
  CourseReview,
  CourseReviewAuthor,
  ModuleCompletionSummary,
  ReviewEligibility,
} from "@/lib/reviews/types";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function toCourseReviewAuthor(user: {
  id: string;
  nama: string;
}): CourseReviewAuthor {
  return {
    id: user.id,
    nama: user.nama,
    initials: initialsFromName(user.nama),
  };
}

export function serializeCourseReview(review: {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  user: { id: string; nama: string };
}): CourseReview {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    user: toCourseReviewAuthor(review.user),
  };
}

export async function findCourseBySlug(courseSlug: string) {
  return db.course.findUnique({
    where: { slug: courseSlug },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: { orderBy: { sortOrder: "asc" }, select: { id: true } },
        },
      },
    },
  });
}

export async function getModuleCompletionSummaries(
  userId: string,
  course: NonNullable<Awaited<ReturnType<typeof findCourseBySlug>>>
): Promise<ModuleCompletionSummary[]> {
  const lessonIds = course.modules.flatMap((module) => module.lessons.map((l) => l.id));
  if (lessonIds.length === 0) return [];

  const progress = await db.lessonProgress.findMany({
    where: {
      userId,
      lessonId: { in: lessonIds },
      completed: true,
    },
    select: { lessonId: true },
  });

  const completedIds = new Set(progress.map((p) => p.lessonId));

  return course.modules.map((module) => {
    const lessonCount = module.lessons.length;
    const completedLessonCount = module.lessons.filter((l) => completedIds.has(l.id)).length;
    return {
      moduleId: module.id,
      title: module.title,
      lessonCount,
      completedLessonCount,
      isComplete: lessonCount > 0 && completedLessonCount === lessonCount,
    };
  });
}

export async function getReviewEligibility(
  userId: string,
  courseSlug: string
): Promise<{ courseId: string; eligibility: ReviewEligibility } | null> {
  const course = await findCourseBySlug(courseSlug);
  if (!course) return null;

  const modules = await getModuleCompletionSummaries(userId, course);
  const completedModules = modules.filter((m) => m.isComplete).length;
  const existing = await db.review.findUnique({
    where: {
      userId_courseId: { userId, courseId: course.id },
    },
    select: { id: true },
  });

  let canReview = false;
  let reason: string | null = null;

  if (existing) {
    reason = "Kamu sudah mengirim ulasan untuk kelas ini.";
  } else if (completedModules === 0) {
    reason =
      "Selesaikan minimal satu modul penuh terlebih dahulu sebelum memberi rating & ulasan.";
  } else {
    canReview = true;
  }

  return {
    courseId: course.id,
    eligibility: {
      canReview,
      reason,
      completedModules,
      totalModules: modules.length,
      modules,
      existingReviewId: existing?.id ?? null,
    },
  };
}

/** @deprecated Use recalculateCourseStats from @/lib/stats/server */
export async function recalculateCourseRating(courseId: string) {
  const { recalculateCourseStats } = await import("@/lib/stats/server");
  const stats = await recalculateCourseStats(courseId);
  return stats.rating;
}

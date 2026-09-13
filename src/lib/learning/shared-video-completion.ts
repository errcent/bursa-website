import { db } from "@/lib/db";
import { toClientLessonId } from "@/lib/learning/progress";
import { parseBunnyVideoId } from "@/lib/video/bunny";

function videoSignature(videoUrl: string | null | undefined): string | null {
  const bunny = parseBunnyVideoId(videoUrl);
  if (bunny) return `bunny:${bunny}`;
  const trimmed = videoUrl?.trim();
  if (!trimmed) return null;
  return `url:${trimmed}`;
}

/** Mark lessons complete in UI when user completed another lesson with the same video asset. */
export async function expandCompletedLegacyIdsBySharedVideo(
  userId: string,
  courseLessons: { id: string; legacyId: string | null; videoUrl: string | null }[]
): Promise<Set<string>> {
  if (courseLessons.length === 0) return new Set();

  const courseLessonIds = courseLessons.map((l) => l.id);
  const completedInCourse = await db.lessonProgress.findMany({
    where: { userId, lessonId: { in: courseLessonIds }, completed: true },
    select: { lessonId: true },
  });
  const completedIds = new Set(completedInCourse.map((r) => r.lessonId));

  const allCompleted = await db.lessonProgress.findMany({
    where: { userId, completed: true },
    select: {
      lesson: { select: { videoUrl: true } },
    },
  });

  const watchedSignatures = new Set<string>();
  for (const row of allCompleted) {
    const sig = videoSignature(row.lesson.videoUrl);
    if (sig) watchedSignatures.add(sig);
  }

  if (watchedSignatures.size === 0) {
    return new Set(
      courseLessons
        .filter((l) => completedIds.has(l.id))
        .map((l) => toClientLessonId(l))
    );
  }

  const legacyCompleted = new Set<string>();
  for (const lesson of courseLessons) {
    if (completedIds.has(lesson.id)) {
      legacyCompleted.add(toClientLessonId(lesson));
      continue;
    }
    const sig = videoSignature(lesson.videoUrl);
    if (sig && watchedSignatures.has(sig)) {
      legacyCompleted.add(toClientLessonId(lesson));
    }
  }

  return legacyCompleted;
}

export async function completedKeysForPlaylistItems(
  userId: string | null,
  items: { courseSlug: string | null; lessonLegacyId: string | null }[]
): Promise<Set<string>> {
  const keys = new Set<string>();
  if (!userId) return keys;

  const pairs = items.filter(
    (i): i is { courseSlug: string; lessonLegacyId: string } =>
      Boolean(i.courseSlug && i.lessonLegacyId)
  );
  if (pairs.length === 0) return keys;

  const lessons = await db.lesson.findMany({
    where: {
      OR: pairs.map((p) => ({
        legacyId: p.lessonLegacyId,
        module: { course: { slug: p.courseSlug } },
      })),
    },
    select: { id: true, legacyId: true, videoUrl: true, module: { select: { course: { select: { slug: true } } } } },
  });

  const byPair = new Map<string, (typeof lessons)[0]>();
  for (const lesson of lessons) {
    const slug = lesson.module.course.slug;
    const legacy = lesson.legacyId ?? lesson.id;
    byPair.set(`${slug}/${legacy}`, lesson);
  }

  const allLessonIds = lessons.map((l) => l.id);
  const progressRows =
    allLessonIds.length === 0
      ? []
      : await db.lessonProgress.findMany({
          where: { userId, lessonId: { in: allLessonIds }, completed: true },
          select: { lessonId: true },
        });
  const completedLessonIds = new Set(progressRows.map((r) => r.lessonId));

  const allCompleted = await db.lessonProgress.findMany({
    where: { userId, completed: true },
    select: { lesson: { select: { videoUrl: true } } },
  });
  const watchedSignatures = new Set<string>();
  for (const row of allCompleted) {
    const sig = videoSignature(row.lesson.videoUrl);
    if (sig) watchedSignatures.add(sig);
  }

  for (const item of pairs) {
    const lesson = byPair.get(`${item.courseSlug}/${item.lessonLegacyId}`);
    if (!lesson) continue;
    const legacy = lesson.legacyId ?? lesson.id;
    if (completedLessonIds.has(lesson.id)) {
      keys.add(`${item.courseSlug}/${legacy}`);
      continue;
    }
    const sig = videoSignature(lesson.videoUrl);
    if (sig && watchedSignatures.has(sig)) {
      keys.add(`${item.courseSlug}/${legacy}`);
    }
  }

  return keys;
}

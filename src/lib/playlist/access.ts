import { db } from "@/lib/db";
import type { PlaylistItemAccessStatus, PlaylistItemView } from "@/lib/playlist/types";

type PlaylistItemRef = {
  lessonId: string | null;
  courseId: string | null;
};

export type PlaylistAccessContext = {
  enrolledCourseIds: Set<string>;
  freePreviewLessonIds: Set<string>;
};

function collectCourseIds(items: PlaylistItemRef[]): string[] {
  const ids = new Set<string>();
  for (const item of items) {
    if (item.courseId) ids.add(item.courseId);
  }
  return [...ids];
}

function collectLessonIds(items: PlaylistItemRef[]): string[] {
  return items.map((item) => item.lessonId).filter((id): id is string => Boolean(id));
}

async function buildFreePreviewLessonIds(lessonIds: string[]): Promise<Set<string>> {
  if (lessonIds.length === 0) return new Set();

  const lessons = await db.lesson.findMany({
    where: { id: { in: lessonIds } },
    select: {
      id: true,
      isPreviewGratis: true,
      module: {
        select: {
          id: true,
          course: {
            select: {
              modules: {
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  lessons: {
                    orderBy: { sortOrder: "asc" },
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const freeIds = new Set<string>();

  for (const lesson of lessons) {
    if (lesson.isPreviewGratis) {
      freeIds.add(lesson.id);
      continue;
    }

    const modules = lesson.module.course.modules;
    const moduleIndex = modules.findIndex((mod) => mod.id === lesson.module.id);
    if (moduleIndex !== 0) continue;

    const firstLessonId = modules[0]?.lessons[0]?.id;
    if (firstLessonId === lesson.id) {
      freeIds.add(lesson.id);
    }
  }

  return freeIds;
}

export async function buildPlaylistAccessContext(
  userId: string | null,
  items: PlaylistItemRef[]
): Promise<PlaylistAccessContext> {
  const courseIds = collectCourseIds(items);
  const lessonIds = collectLessonIds(items);

  const [enrollments, freePreviewLessonIds] = await Promise.all([
    userId && courseIds.length > 0
      ? db.enrollment.findMany({
          where: { userId, courseId: { in: courseIds } },
          select: { courseId: true },
        })
      : Promise.resolve([]),
    buildFreePreviewLessonIds(lessonIds),
  ]);

  return {
    enrolledCourseIds: new Set(enrollments.map((row) => row.courseId)),
    freePreviewLessonIds,
  };
}

export function resolvePlaylistItemAccess(
  item: PlaylistItemView,
  ctx: PlaylistAccessContext
): PlaylistItemAccessStatus {
  const courseId = item.courseId;
  const enrolled = courseId ? ctx.enrolledCourseIds.has(courseId) : false;

  if (enrolled) return "owned";

  if (item.lessonId && ctx.freePreviewLessonIds.has(item.lessonId)) {
    return "free";
  }

  return "locked";
}

export function enrichPlaylistItemsWithAccess(
  items: PlaylistItemView[],
  ctx: PlaylistAccessContext
): PlaylistItemView[] {
  return items.map((item) => ({
    ...item,
    accessStatus: resolvePlaylistItemAccess(item, ctx),
  }));
}

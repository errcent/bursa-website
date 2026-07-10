import { db } from "@/lib/db";

const lessonInclude = {
  module: {
    include: {
      course: {
        include: {
          mentor: { select: { userId: true } },
        },
      },
    },
  },
} as const;

export async function findLessonByCourseAndLegacyId(
  courseSlug: string,
  lessonLegacyId: string
) {
  const byLegacy = await db.lesson.findFirst({
    where: {
      legacyId: lessonLegacyId,
      module: { course: { slug: courseSlug } },
    },
    include: lessonInclude,
  });
  if (byLegacy) return byLegacy;

  return db.lesson.findFirst({
    where: {
      id: lessonLegacyId,
      module: { course: { slug: courseSlug } },
    },
    include: lessonInclude,
  });
}

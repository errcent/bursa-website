/** Client lesson id used in URLs — legacy mock id or Prisma cuid. */
export function toClientLessonId(lesson: { legacyId: string | null; id: string }): string {
  return lesson.legacyId ?? lesson.id;
}

export function computeProgressPercent(completedLessons: number, totalLessons: number): number {
  if (totalLessons <= 0) return 0;
  return Math.round((completedLessons / totalLessons) * 100);
}

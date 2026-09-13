/** Stable client key for a lesson in a course (URLs, guest storage). */
export function lessonProgressKey(courseSlug: string, lessonLegacyId: string): string {
  return `${courseSlug}/${lessonLegacyId}`;
}

export function parseLessonProgressKey(key: string): { courseSlug: string; lessonLegacyId: string } | null {
  const idx = key.indexOf("/");
  if (idx <= 0) return null;
  return {
    courseSlug: key.slice(0, idx),
    lessonLegacyId: key.slice(idx + 1),
  };
}

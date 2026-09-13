/** Lesson notes on `/belajar` — device-local only (no server persistence). */

const STORAGE_PREFIX = "bursa:lesson-notes:";

function noteKey(courseSlug: string, lessonId: string): string {
  return `${STORAGE_PREFIX}${courseSlug}:${lessonId}`;
}

export function loadLessonNoteContent(courseSlug: string, lessonId: string): string {
  if (typeof window === "undefined") return "<p></p>";
  try {
    const raw = localStorage.getItem(noteKey(courseSlug, lessonId));
    if (!raw) return "<p></p>";
    const parsed = JSON.parse(raw) as { content?: string };
    return typeof parsed.content === "string" ? parsed.content : "<p></p>";
  } catch {
    return "<p></p>";
  }
}

export function saveLessonNoteContent(
  courseSlug: string,
  lessonId: string,
  content: string
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      noteKey(courseSlug, lessonId),
      JSON.stringify({ content, savedAt: Date.now() })
    );
  } catch {
    // Quota or private mode
  }
}

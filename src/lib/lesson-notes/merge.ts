import type { LessonNote } from "@/lib/lesson-notes/types";

export function sortNotes(notes: LessonNote[]) {
  return [...notes].sort(
    (a, b) =>
      a.timestampSeconds - b.timestampSeconds || a.createdAt.localeCompare(b.createdAt)
  );
}

/** Oldest note is treated as the canonical row for this lesson. */
export function pickPrimaryNote(notes: LessonNote[]) {
  return sortNotes(notes)[0] ?? null;
}

/** Merge legacy timestamp-split notes into one HTML document. */
export function mergeNotesContent(notes: LessonNote[]) {
  const sorted = sortNotes(notes);
  if (sorted.length === 0) return "<p></p>";
  if (sorted.length === 1) return sorted[0].content;
  return sorted.map((note) => note.content).join("<p></p>");
}

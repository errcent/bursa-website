import type { Note } from "@prisma/client";

import type { LessonNote } from "@/lib/lesson-notes/types";

export function serializeNote(note: Note): LessonNote {
  return {
    id: note.id,
    lessonId: note.lessonId,
    content: note.content,
    timestampSeconds: note.timestampSeconds,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

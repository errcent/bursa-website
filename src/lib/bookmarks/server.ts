import type { BookmarkTargetType } from "@prisma/client";

import { bookmarkId, type BookmarkEntry, type BookmarkRef } from "@/lib/bookmarks/types";

export function refToDbFields(ref: BookmarkRef): {
  type: BookmarkTargetType;
  targetKey: string;
  slug: string | null;
  courseSlug: string | null;
  lessonId: string | null;
} {
  const targetKey = bookmarkId(ref);
  if (ref.type === "lesson") {
    return {
      type: "LESSON",
      targetKey,
      slug: null,
      courseSlug: ref.courseSlug,
      lessonId: ref.lessonId,
    };
  }
  return {
    type: ref.type.toUpperCase() as BookmarkTargetType,
    targetKey,
    slug: ref.slug,
    courseSlug: null,
    lessonId: null,
  };
}

export function rowToBookmarkEntry(row: {
  type: BookmarkTargetType;
  slug: string | null;
  courseSlug: string | null;
  lessonId: string | null;
  createdAt: Date;
}): BookmarkEntry {
  const savedAt = row.createdAt.toISOString();
  if (row.type === "LESSON" && row.courseSlug && row.lessonId) {
    return { type: "lesson", courseSlug: row.courseSlug, lessonId: row.lessonId, savedAt };
  }
  if (row.type === "COURSE" && row.slug) return { type: "course", slug: row.slug, savedAt };
  if (row.type === "PLAYLIST" && row.slug) return { type: "playlist", slug: row.slug, savedAt };
  if (row.type === "MENTOR" && row.slug) return { type: "mentor", slug: row.slug, savedAt };
  throw new Error("Invalid bookmark row");
}

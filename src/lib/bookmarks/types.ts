export type BookmarkType = "course" | "lesson" | "playlist" | "mentor";

export type BookmarkRef =
  | { type: "course"; slug: string }
  | { type: "lesson"; courseSlug: string; lessonId: string }
  | { type: "playlist"; slug: string }
  | { type: "mentor"; slug: string };

export type BookmarkEntry = BookmarkRef & {
  savedAt: string;
};

export function bookmarkId(ref: BookmarkRef): string {
  if (ref.type === "lesson") {
    return `lesson:${ref.courseSlug}:${ref.lessonId}`;
  }
  return `${ref.type}:${ref.slug}`;
}

export function parseBookmarkId(id: string): BookmarkRef | null {
  if (id.startsWith("lesson:")) {
    const rest = id.slice("lesson:".length);
    const sep = rest.indexOf(":");
    if (sep <= 0) return null;
    const courseSlug = rest.slice(0, sep);
    const lessonId = rest.slice(sep + 1);
    if (!courseSlug || !lessonId) return null;
    return { type: "lesson", courseSlug, lessonId };
  }

  const sep = id.indexOf(":");
  if (sep <= 0) return null;
  const type = id.slice(0, sep) as BookmarkType;
  const slug = id.slice(sep + 1);
  if (!slug || !["course", "playlist", "mentor"].includes(type)) return null;
  return { type, slug } as BookmarkRef;
}

export function isBookmarkEntry(value: unknown): value is BookmarkEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as BookmarkEntry;
  if (typeof entry.savedAt !== "string") return false;
  if (entry.type === "lesson") {
    return (
      typeof entry.courseSlug === "string" &&
      typeof entry.lessonId === "string" &&
      entry.courseSlug.length > 0 &&
      entry.lessonId.length > 0
    );
  }
  if (entry.type === "course" || entry.type === "playlist" || entry.type === "mentor") {
    return typeof entry.slug === "string" && entry.slug.length > 0;
  }
  return false;
}

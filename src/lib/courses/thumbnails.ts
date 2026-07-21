import type { ThumbnailKind } from "@/lib/thumbnails/ai-prompt-builder";
import {
  aiThumbnailApiPath,
  aiThumbnailStaticPath,
  resolveAiThumbnailUrl,
} from "@/lib/thumbnails/resolve";

/** @deprecated Prefer resolveCourseThumbnailUrl — kept for admin upload paths. */
export const COURSE_THUMBNAIL_DIR = "/courses";

/** Admin uploads land under public/uploads/courses/ (gitignored). */
export const COURSE_UPLOAD_DIR = "/uploads/courses";

export function defaultCourseThumbnailPath(slug: string): string {
  return aiThumbnailStaticPath("course", slug);
}

export function resolveCourseThumbnailUrl(course: {
  slug: string;
  thumbnailUrl?: string | null;
}): string {
  const trimmed = course.thumbnailUrl?.trim();
  if (trimmed && !trimmed.endsWith(".svg")) {
    return trimmed;
  }
  return resolveAiThumbnailUrl("course", course.slug, trimmed);
}

export function courseThumbnailFallbackApiPath(slug: string): string {
  return aiThumbnailApiPath("course", slug);
}

export { type ThumbnailKind };

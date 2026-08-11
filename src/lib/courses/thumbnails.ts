import type { ThumbnailKind } from "@/lib/thumbnails/ai-prompt-builder";
import {
  aiThumbnailApiPath,
  aiThumbnailStaticPath,
  resolveAiThumbnailUrl,
} from "@/lib/thumbnails/resolve";

export function defaultCourseThumbnailPath(slug: string): string {
  return aiThumbnailStaticPath("course", slug);
}

export function resolveCourseThumbnailUrl(course: {
  slug: string;
  thumbnailUrl?: string | null;
}): string | null {
  const trimmed = course.thumbnailUrl?.trim();
  if (trimmed && !trimmed.endsWith(".svg")) {
    return resolveAiThumbnailUrl("course", course.slug, trimmed);
  }
  return resolveAiThumbnailUrl("course", course.slug, trimmed);
}

export function courseThumbnailFallbackApiPath(slug: string): string {
  return aiThumbnailApiPath("course", slug);
}

export { type ThumbnailKind };

import type { ThumbnailKind } from "./ai-prompt-builder";

export const AI_THUMBNAIL_DIR = "/generated/thumbnails";

export function aiThumbnailStaticPath(kind: ThumbnailKind, slug: string): string {
  return `${AI_THUMBNAIL_DIR}/${kind}/${slug}.webp`;
}

/** On-demand proxy when static asset is missing (dev / pre-generate). */
export function aiThumbnailApiPath(kind: ThumbnailKind, slug: string): string {
  return `/api/thumbnails/${kind}/${slug}`;
}

export function resolveAiThumbnailUrl(
  kind: ThumbnailKind,
  slug: string,
  explicitUrl?: string | null
): string {
  const trimmed = explicitUrl?.trim();
  if (trimmed) return trimmed;
  return aiThumbnailStaticPath(kind, slug);
}

import {
  aiThumbnailApiPath,
  aiThumbnailStaticPath,
  resolveAiThumbnailUrl,
} from "@/lib/thumbnails/resolve";

export function defaultPlaylistThumbnailPath(slug: string): string {
  return aiThumbnailStaticPath("playlist", slug);
}

export function resolvePlaylistThumbnailUrl(playlist: {
  slug: string;
  thumbnailUrl?: string | null;
}): string {
  return resolveAiThumbnailUrl("playlist", playlist.slug, playlist.thumbnailUrl);
}

export function playlistThumbnailFallbackApiPath(slug: string): string {
  return aiThumbnailApiPath("playlist", slug);
}

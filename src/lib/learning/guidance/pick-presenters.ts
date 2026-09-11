import { resolvePlaylistThumbnailUrl } from "@/lib/playlists/thumbnails";
import type { ScoredGuidancePick } from "@/lib/learning/guidance/types";
import { aiThumbnailApiPath } from "@/lib/thumbnails/resolve";

export function guidancePickHref(pick: ScoredGuidancePick): string {
  if (pick.kind === "course" && pick.course) return `/kelas/${pick.course.slug}`;
  if (pick.kind === "playlist" && pick.playlist) return `/playlist/${pick.playlist.slug}`;
  return "/katalog";
}

export function guidancePickTitle(pick: ScoredGuidancePick): string {
  if (pick.kind === "course" && pick.course) return pick.course.title;
  if (pick.kind === "playlist" && pick.playlist) return pick.playlist.title;
  return "Rekomendasi";
}

export function guidancePickKindLabel(pick: ScoredGuidancePick): string {
  return pick.kind === "course" ? "Kelas" : "Playlist";
}

const REDUNDANT_REASON_PATTERN =
  /^(Selaras|Fokus):\s/i;

/** First reason line safe to show under quiz picks (no instrument echo). */
export function guidancePickDisplayReason(reasons: string[]): string | undefined {
  return reasons.find((line) => line.trim().length > 0 && !REDUNDANT_REASON_PATTERN.test(line));
}

export function guidancePickReason(pick: ScoredGuidancePick): string | undefined {
  return guidancePickDisplayReason(pick.reasons);
}

export function guidancePickImage(pick: ScoredGuidancePick): string {
  if (pick.kind === "course" && pick.course) {
    return (
      pick.course.thumbnailUrl ??
      aiThumbnailApiPath("course", pick.course.slug)
    );
  }
  if (pick.kind === "playlist" && pick.playlist) {
    return (
      resolvePlaylistThumbnailUrl(pick.playlist) ??
      aiThumbnailApiPath("playlist", pick.playlist.slug)
    );
  }
  return aiThumbnailApiPath("course", "placeholder");
}

export function guidancePickKey(pick: ScoredGuidancePick): string {
  if (pick.kind === "course" && pick.course) return `course:${pick.course.slug}`;
  if (pick.kind === "playlist" && pick.playlist) return `playlist:${pick.playlist.slug}`;
  return `pick:${pick.score}`;
}

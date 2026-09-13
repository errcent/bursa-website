import { CheckCircle2, Lock } from "lucide-react";

import type { PlaylistItemAccessStatus, PlaylistItemView } from "@/lib/playlist/types";

export function formatPlaylistDuration(minutes: number | null) {
  if (!minutes || minutes <= 0) return "-";
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} j ${mins} mnt` : `${hours} jam`;
}

export function formatDurationBadge(minutes: number | null) {
  if (!minutes || minutes <= 0) return "0:00";
  return `${minutes}:00`;
}

export function lessonHref(item: PlaylistItemView, playlistSlug?: string | null) {
  if (!item.courseSlug) return "/katalog";
  let href: string;
  if (item.lessonLegacyId) {
    href = `/belajar/${item.courseSlug}/${item.lessonLegacyId}`;
  } else {
    href = `/kelas/${item.courseSlug}`;
  }
  if (playlistSlug && item.lessonLegacyId) {
    const params = new URLSearchParams({ playlist: playlistSlug });
    return `${href}?${params.toString()}`;
  }
  return href;
}

export function isItemPlayable(status: PlaylistItemAccessStatus | undefined) {
  return status === "owned" || status === "free";
}

/** Always deep-link to lesson/kelas; guest locked playback is handled in /belajar. */
export function itemHref(item: PlaylistItemView, playlistSlug?: string | null) {
  return lessonHref(item, playlistSlug);
}

export function AccessBadge({ status }: { status: PlaylistItemAccessStatus | undefined }) {
  if (status === "owned") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald/25 bg-emerald/10 px-2 py-0.5 text-[10px] font-medium text-emerald">
        <CheckCircle2 className="size-3" />
        Tersedia
      </span>
    );
  }
  if (status === "free") return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      <Lock className="size-3" />
      Terkunci
    </span>
  );
}

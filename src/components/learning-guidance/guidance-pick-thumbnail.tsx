"use client";

import { CourseThumbnail } from "@/components/course-thumbnail";
import { PlaylistThumbnail } from "@/components/playlist/playlist-thumbnail";
import { ThumbnailPlaceholder } from "@/components/thumbnail-placeholder";
import type { ScoredGuidancePick } from "@/lib/learning/guidance/types";
import { cn } from "@/lib/utils";

export function GuidancePickThumbnail({
  pick,
  className,
  withScrim = true,
  fillSlot = true,
  alt,
}: {
  pick: ScoredGuidancePick;
  className?: string;
  withScrim?: boolean;
  fillSlot?: boolean;
  alt?: string;
}) {
  if (pick.kind === "course" && pick.course) {
    return (
      <CourseThumbnail
        course={pick.course}
        fillSlot={fillSlot}
        withScrim={withScrim}
        alt={alt ?? pick.course.title}
        className={cn("h-full w-full", className)}
      />
    );
  }

  if (pick.kind === "playlist" && pick.playlist) {
    return (
      <PlaylistThumbnail
        playlist={pick.playlist}
        fillSlot={fillSlot}
        withScrim={withScrim}
        alt={alt ?? pick.playlist.title}
        className={cn("h-full w-full", className)}
      />
    );
  }

  return <ThumbnailPlaceholder label="Rekomendasi" className={className} />;
}

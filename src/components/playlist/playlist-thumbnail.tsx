"use client";

import { AiThumbnailImage } from "@/components/course-thumbnail";
import {
  playlistThumbnailFallbackApiPath,
  resolvePlaylistThumbnailUrl,
} from "@/lib/playlists/thumbnails";
import {
  AI_THUMBNAIL_ASPECT_CLASS,
  AI_THUMBNAIL_FRAME_CLASS,
  type ThumbnailObjectFit,
} from "@/lib/thumbnails/constants";
import { cn } from "@/lib/utils";

type PlaylistThumbnailProps = {
  playlist: { slug: string; title: string; thumbnailUrl?: string | null };
  withScrim?: boolean;
  className?: string;
  alt?: string;
  objectFit?: ThumbnailObjectFit;
  fillSlot?: boolean;
};

export function PlaylistThumbnail({
  playlist,
  withScrim = false,
  className,
  alt,
  objectFit = "cover",
  fillSlot = false,
}: PlaylistThumbnailProps) {
  const primarySrc = resolvePlaylistThumbnailUrl(playlist);

  return (
    <div
      className={cn(
        AI_THUMBNAIL_FRAME_CLASS,
        !fillSlot && AI_THUMBNAIL_ASPECT_CLASS,
        objectFit === "contain" && "ai-thumbnail--contain",
        fillSlot && "ai-thumbnail--slot",
        className
      )}
    >
      <AiThumbnailImage
        kind="playlist"
        slug={playlist.slug}
        primarySrc={primarySrc}
        fallbackApiPath={playlistThumbnailFallbackApiPath(playlist.slug)}
        alt={alt ?? playlist.title}
        className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />
      <div
        aria-hidden
        className="ai-thumbnail__overlay bg-[radial-gradient(circle_at_30%_20%,var(--glow),transparent_60%)] opacity-30"
      />
      {withScrim && (
        <div
          aria-hidden
          className="ai-thumbnail__overlay bg-gradient-to-t from-black/85 via-black/35 to-transparent"
          style={{
            top: "auto",
            height: "66.666667%",
          }}
        />
      )}
    </div>
  );
}

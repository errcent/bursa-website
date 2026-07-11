"use client";

import { Play } from "lucide-react";

import { resolveCourseThumbnailUrl } from "@/lib/courses/thumbnails";
import type { Course } from "@/lib/types";
import { cn } from "@/lib/utils";

type CourseThumbnailProps = {
  course: Pick<Course, "slug" | "thumbnailUrl">;
  className?: string;
  /** Show a subtle preview-available cue in the corner on hover (catalog cards). */
  showPlayOverlay?: boolean;
  alt?: string;
};

export function CourseThumbnail({
  course,
  className,
  showPlayOverlay = false,
  alt,
}: CourseThumbnailProps) {
  const src = resolveCourseThumbnailUrl(course);

  return (
    <div className={cn("relative overflow-hidden bg-surface-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? "Thumbnail kelas"}
        className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--glow),transparent_60%)] opacity-30" />
      {showPlayOverlay && (
        <span
          className="absolute bottom-2 right-2 flex size-6 items-center justify-center rounded-full bg-background/70 text-foreground/85 opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-300 ease-out group-hover:opacity-100"
          aria-hidden
        >
          <Play className="size-3 fill-current" />
        </span>
      )}
    </div>
  );
}

"use client";

import { PlayCircle } from "lucide-react";

import { resolveCourseThumbnailUrl } from "@/lib/courses/thumbnails";
import type { Course } from "@/lib/types";
import { cn } from "@/lib/utils";

type CourseThumbnailProps = {
  course: Pick<Course, "slug" | "thumbnailUrl">;
  className?: string;
  /** Show play icon overlay on hover (catalog cards). */
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
        className="absolute inset-0 size-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--glow),transparent_60%)] opacity-30" />
      {showPlayOverlay && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
          <PlayCircle className="size-9 text-foreground/90" />
        </div>
      )}
    </div>
  );
}

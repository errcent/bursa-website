"use client";

import { MentorPhoto, type MentorPhotoSubject } from "@/components/mentor-photo";
import { resolveCourseThumbnailUrl } from "@/lib/courses/thumbnails";
import type { Course } from "@/lib/types";
import { cn } from "@/lib/utils";

type CourseThumbnailProps = {
  course: Pick<Course, "slug" | "thumbnailUrl">;
  /** When set, renders the mentor's themed backdrop + cutout instead of the generic instrument SVG art. */
  mentor?: MentorPhotoSubject | null;
  className?: string;
  /** Adds a bottom gradient scrim so overlaid text stays legible (catalog/carousel cards). */
  withScrim?: boolean;
  alt?: string;
};

export function CourseThumbnail({
  course,
  mentor,
  className,
  withScrim = false,
  alt,
}: CourseThumbnailProps) {
  return (
    <div className={cn("relative overflow-hidden bg-surface-2", className)}>
      {mentor ? (
        <MentorPhoto mentor={mentor} className="absolute inset-0" />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveCourseThumbnailUrl(course)}
            alt={alt ?? "Thumbnail kelas"}
            className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--glow),transparent_60%)] opacity-30" />
        </>
      )}
      {withScrim && (
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
        />
      )}
    </div>
  );
}

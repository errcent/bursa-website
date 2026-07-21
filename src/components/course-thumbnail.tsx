"use client";

import { useState } from "react";

import {
  courseThumbnailFallbackApiPath,
  resolveCourseThumbnailUrl,
} from "@/lib/courses/thumbnails";
import {
  AI_THUMBNAIL_ASPECT_CLASS,
  AI_THUMBNAIL_FRAME_CLASS,
  AI_THUMBNAIL_HEIGHT,
  AI_THUMBNAIL_MEDIA_CLASS,
  AI_THUMBNAIL_WIDTH,
  type ThumbnailObjectFit,
} from "@/lib/thumbnails/constants";
import type { Course } from "@/lib/types";
import { cn } from "@/lib/utils";

type AiThumbnailImageProps = {
  kind: "course" | "playlist";
  slug: string;
  primarySrc: string;
  alt: string;
  className?: string;
  fallbackApiPath: string;
};

export function AiThumbnailImage({
  slug,
  primarySrc,
  alt,
  className,
  fallbackApiPath,
}: AiThumbnailImageProps) {
  const [src, setSrc] = useState(primarySrc);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={AI_THUMBNAIL_WIDTH}
      height={AI_THUMBNAIL_HEIGHT}
      className={cn(AI_THUMBNAIL_MEDIA_CLASS, className)}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (src !== fallbackApiPath) {
          setSrc(fallbackApiPath);
        }
      }}
      data-thumbnail-slug={slug}
    />
  );
}

type CourseThumbnailProps = {
  course: Pick<Course, "slug" | "thumbnailUrl">;
  className?: string;
  withScrim?: boolean;
  alt?: string;
  progressPercent?: number;
  /** cover when container matches native 16:10 (default); contain letterboxes in fixed slots */
  objectFit?: ThumbnailObjectFit;
  /** Fill a fixed-size parent (e.g. square dashboard icon) without distorting media */
  fillSlot?: boolean;
};

export function CourseThumbnail({
  course,
  className,
  withScrim = false,
  alt,
  progressPercent,
  objectFit = "cover",
  fillSlot = false,
}: CourseThumbnailProps) {
  const primarySrc = resolveCourseThumbnailUrl(course);
  const clampedProgress =
    progressPercent != null
      ? Math.min(100, Math.max(0, progressPercent))
      : null;

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
        kind="course"
        slug={course.slug}
        primarySrc={primarySrc}
        fallbackApiPath={courseThumbnailFallbackApiPath(course.slug)}
        alt={alt ?? "Thumbnail kelas"}
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
      {clampedProgress != null && (
        <div
          className="course-thumbnail-progress"
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progress kelas"
        >
          <div
            className="course-thumbnail-progress__fill"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}

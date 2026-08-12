"use client";

import Link from "next/link";

import { BookmarkToggleButton } from "@/components/bookmark-toggle-button";
import { CourseThumbnail } from "@/components/course-thumbnail";
import { LEVEL_TOOLTIP, LevelBadge } from "@/components/instrument-badge";
import { useMyLearning } from "@/hooks/use-my-learning";
import { courseEnrollmentFromLearning } from "@/lib/learning/enrollment";
import { useCatalogIndex } from "@/hooks/use-catalog-index";
import { cn } from "@/lib/utils";
import type { Course, Mentor } from "@/lib/types";

export type CourseCardEnrollment = {
  progressPercent: number;
  completedLessons?: number;
  totalLessons?: number;
  lastLessonId?: string;
};

function courseVideoCount(course: Course): number | undefined {
  if (course.lessonCount != null && course.lessonCount > 0) return course.lessonCount;
  if (!course.modules?.length) return undefined;
  return course.modules.reduce((total, mod) => total + mod.lessons.length, 0);
}

function courseMetaLabel(course: Course): string {
  const durationLabel = `${course.durationHours} jam`;
  const videoCount = courseVideoCount(course);
  if (videoCount !== undefined) return `${videoCount} video · ${durationLabel}`;
  return durationLabel;
}

export function CourseCard({
  course,
  className,
  enrollment: enrollmentProp,
  mentor: mentorProp,
  variant = "default",
  hideBookmark = false,
}: {
  course: Course;
  className?: string;
  /** When set, card is treated as purchased/enrolled (thin progress bar on the thumbnail). */
  enrollment?: CourseCardEnrollment | null;
  /** Optional mentor payload, avoids mock lookup when parent already has catalog data. */
  mentor?: Mentor | null;
  /** "featured", cinematic overlay card for landing carousel; "catalog", title below thumbnail. */
  variant?: "default" | "featured" | "catalog";
  /** Hide bookmark toggle (e.g. landing page). */
  hideBookmark?: boolean;
}) {
  const { bySlug } = useMyLearning();
  const { index: catalogIndex } = useCatalogIndex();
  const enrollment =
    enrollmentProp ?? courseEnrollmentFromLearning(bySlug.get(course.slug));
  const mentor =
    mentorProp ??
    catalogIndex?.mentors.find((item) => item.slug === course.mentorSlug) ??
    null;
  const enrolled = Boolean(enrollment);
  const progressPercent = Math.min(
    100,
    Math.max(0, enrollment?.progressPercent ?? 0)
  );
  const href =
    enrolled && enrollment?.lastLessonId
      ? `/belajar/${course.slug}/${enrollment.lastLessonId}`
      : `/kelas/${course.slug}`;

  const isFeatured = variant === "featured";
  const isCatalog = variant === "catalog";
  const subtitle = isFeatured
    ? null
    : mentor
      ? mentor.name
      : course.instrument;

  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        "@container group relative block w-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isCatalog ? "overflow-visible" : "overflow-hidden",
        isFeatured ? "rounded-2xl shadow-lg transition-shadow duration-300 hover:shadow-xl" : "rounded-xl",
        className
      )}
    >
      <div
        className={cn(
          "group/level-reveal relative aspect-video w-full min-h-0 overflow-hidden bg-surface-2",
          isFeatured ? "rounded-2xl" : "rounded-xl"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 transition-[filter] duration-300 ease-out",
            "group-has-[[data-level-hotspot]:hover]/level-reveal:blur-[3px]",
            "group-has-[[data-level-hotspot]:hover]/level-reveal:brightness-[0.45]"
          )}
        >
          <CourseThumbnail
            course={course}
            withScrim={!isCatalog}
            fillSlot
            className="absolute inset-0"
            alt={course.title}
            progressPercent={enrolled ? progressPercent : undefined}
          />
        </div>

        <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5 sm:left-3.5 sm:top-3.5">
          <LevelBadge level={course.level} />
        </div>

        <p
          role="tooltip"
          className={cn(
            "pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-5",
            "text-center font-sans text-[13px] font-medium leading-snug text-white",
            "drop-shadow-[0_1px_8px_rgba(0,0,0,0.65)]",
            "opacity-0 transition-opacity duration-300 ease-out",
            "group-has-[[data-level-hotspot]:hover]/level-reveal:opacity-100",
            isFeatured ? "sm:text-sm" : "sm:text-[13px]"
          )}
        >
          {LEVEL_TOOLTIP[course.level]}
        </p>

        {enrolled && (
          <span
            className={cn(
              "pointer-events-none absolute right-2 top-2 z-10 rounded-full border border-accent/30 bg-accent/20 px-2 py-0.5 text-[10px] font-medium tracking-wide text-accent backdrop-blur-sm transition-opacity duration-300",
              "group-has-[[data-level-hotspot]:hover]/level-reveal:opacity-0"
            )}
          >
            Dimiliki
          </span>
        )}

        {!hideBookmark ? (
          <div
            className={cn(
              "absolute bottom-2.5 left-2.5 z-20 transition-opacity duration-300",
              "group-has-[[data-level-hotspot]:hover]/level-reveal:pointer-events-none",
              "group-has-[[data-level-hotspot]:hover]/level-reveal:opacity-0"
            )}
          >
            <BookmarkToggleButton bookmarkRef={{ type: "course", slug: course.slug }} />
          </div>
        ) : null}

        {!isCatalog ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-1.5 p-2.5 pb-3 transition-opacity duration-300",
              "group-has-[[data-level-hotspot]:hover]/level-reveal:opacity-0"
            )}
          >
            <div className="min-w-0 flex-1">
              <h3
                className={cn(
                  "line-clamp-2 font-heading font-semibold leading-tight text-white",
                  isFeatured
                    ? "text-base @[280px]:text-lg"
                    : "text-sm @[280px]:text-[15px]"
                )}
              >
                {course.title}
              </h3>
              {subtitle && (
                <p
                  className={cn(
                    "mt-1 truncate font-light text-white/70",
                    isFeatured ? "text-xs @[280px]:text-[13px]" : "text-[11px]"
                  )}
                >
                  {subtitle}
                </p>
              )}
            </div>
            <span
              className={cn(
                "hidden shrink-0 whitespace-nowrap rounded-full bg-black/45 px-2 py-1 font-medium text-white/85 backdrop-blur-sm @[220px]:inline",
                isFeatured ? "text-[11px]" : "text-[10px]"
              )}
            >
              {courseMetaLabel(course)}
            </span>
          </div>
        ) : (
          <span
            className={cn(
              "pointer-events-none absolute bottom-2.5 right-2.5 z-10 shrink-0 whitespace-nowrap rounded-full bg-black/45 px-2 py-1 text-[10px] font-medium text-white/85 backdrop-blur-sm transition-opacity duration-300 @[220px]:text-[11px]",
              "group-has-[[data-level-hotspot]:hover]/level-reveal:opacity-0"
            )}
          >
            {courseMetaLabel(course)}
          </span>
        )}
      </div>

      {isCatalog ? (
        <div className="pt-2">
          <h3 className="line-clamp-2 font-heading text-sm font-semibold leading-snug text-foreground @[280px]:text-[15px]">
            {course.title}
          </h3>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[11px] font-light text-muted-foreground @[280px]:text-xs">
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}


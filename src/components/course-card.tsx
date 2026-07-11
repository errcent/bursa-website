"use client";

import Link from "next/link";
import { Flame } from "lucide-react";

import { CourseThumbnail } from "@/components/course-thumbnail";
import { LevelBadge } from "@/components/instrument-badge";
import { useMyLearning } from "@/hooks/use-my-learning";
import { courseEnrollmentFromLearning } from "@/lib/learning/enrollment";
import { getMentorBySlug } from "@/lib/mock-data";
import { formatRating, cn, hasRating } from "@/lib/utils";
import type { Course } from "@/lib/types";

export type CourseCardEnrollment = {
  progressPercent: number;
  completedLessons?: number;
  totalLessons?: number;
  lastLessonId?: string;
};

function courseLessonCount(course: Course): number | undefined {
  if (!course.modules?.length) return undefined;
  return course.modules.reduce((total, mod) => total + mod.lessons.length, 0);
}

function courseMetaLabel(course: Course): string {
  const durationLabel = `${course.durationHours} jam`;
  const lessonCount = courseLessonCount(course);
  if (lessonCount !== undefined) return `${lessonCount} pelajaran · ${durationLabel}`;
  // Listing queries (catalog API) skip the full module payload and only carry
  // a count — still worth surfacing so the pill isn't just a bare duration.
  if (course.moduleCount) return `${course.moduleCount} modul · ${durationLabel}`;
  return durationLabel;
}

export function CourseCard({
  course,
  className,
  enrollment: enrollmentProp,
  isBestseller = false,
}: {
  course: Course;
  className?: string;
  /** When set, card is treated as purchased/enrolled (thin progress bar on the thumbnail). */
  enrollment?: CourseCardEnrollment | null;
  /** Highlights the #1 popular course with a bestseller ribbon. */
  isBestseller?: boolean;
}) {
  const { bySlug } = useMyLearning();
  const enrollment =
    enrollmentProp ?? courseEnrollmentFromLearning(bySlug.get(course.slug));
  const mentor = getMentorBySlug(course.mentorSlug);
  const enrolled = Boolean(enrollment);
  const progressPercent = Math.min(
    100,
    Math.max(0, enrollment?.progressPercent ?? 0)
  );
  const href =
    enrolled && enrollment?.lastLessonId
      ? `/belajar/${course.slug}/${enrollment.lastLessonId}`
      : `/kelas/${course.slug}`;

  const subtitle = mentor
    ? hasRating(course.rating)
      ? `${mentor.name} · ${formatRating(course.rating)}★`
      : mentor.name
    : course.instrument;

  return (
    <Link
      href={href}
      className={cn(
        "@container group relative block w-full overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-surface-2">
        <CourseThumbnail
          course={course}
          mentor={mentor}
          withScrim
          className="absolute inset-0"
          alt={course.title}
          progressPercent={enrolled ? progressPercent : undefined}
        />

        <div className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-1.5">
          {isBestseller && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-foreground shadow-sm">
              <Flame className="size-3" />
              Terlaris
            </span>
          )}
          <LevelBadge level={course.level} />
        </div>

        {enrolled && (
          <span className="pointer-events-none absolute right-2 top-2 z-10 rounded-full border border-accent/30 bg-accent/20 px-2 py-0.5 text-[10px] font-medium tracking-wide text-accent backdrop-blur-sm">
            Dimiliki
          </span>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-1.5 p-2.5 pb-3">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-heading text-sm font-semibold leading-tight text-white @[280px]:text-[15px]">
              {course.title}
            </h3>
            {subtitle && (
              <p className="mt-1 truncate text-[11px] font-light text-white/70">
                {subtitle}
              </p>
            )}
          </div>
          <span className="hidden shrink-0 whitespace-nowrap rounded-full bg-black/45 px-2 py-1 text-[10px] font-medium text-white/85 backdrop-blur-sm @[220px]:inline">
            {courseMetaLabel(course)}
          </span>
        </div>
      </div>
    </Link>
  );
}


"use client";

import Link from "next/link";
import { BadgeCheck, BookOpen, Clock, Flame, Star } from "lucide-react";

import { CourseThumbnail } from "@/components/course-thumbnail";
import { InstrumentBadge, LevelBadge } from "@/components/instrument-badge";
import { StarRating } from "@/components/star-rating";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { getMentorBySlug, formatRupiah } from "@/lib/mock-data";
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

export function CourseCard({
  course,
  className,
  enrollment,
  variant = "default",
  isBestseller = false,
}: {
  course: Course;
  className?: string;
  /** When set, card is treated as purchased/enrolled (progress under thumbnail). */
  enrollment?: CourseCardEnrollment | null;
  /** Poster = compact Netflix-style tile for mobile horizontal rows. */
  variant?: "default" | "poster";
  /** Highlights the #1 popular course with a bestseller ribbon. */
  isBestseller?: boolean;
}) {
  const mentor = getMentorBySlug(course.mentorSlug);
  const enrolled = Boolean(enrollment);
  const isPoster = variant === "poster";
  const lessonCount = courseLessonCount(course);
  const progressPercent = Math.min(
    100,
    Math.max(0, enrollment?.progressPercent ?? 0)
  );
  const href =
    enrolled && enrollment?.lastLessonId
      ? `/belajar/${course.slug}/${enrollment.lastLessonId}`
      : `/kelas/${course.slug}`;

  if (isPoster) {
    return (
      <Link
        href={href}
        className={cn(
          "course-card-poster group flex w-full flex-col overflow-hidden rounded-lg border border-border/80 bg-card",
          enrolled && "ring-1 ring-accent/25",
          className
        )}
      >
        <div className="relative aspect-[2/3]">
          <CourseThumbnail
            course={course}
            className="absolute inset-0"
            showPlayOverlay
            alt={course.title}
          />
          <div className="absolute left-1.5 top-1.5 flex flex-col items-start gap-1">
            {isBestseller && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-amber-foreground shadow-sm">
                <Flame className="size-2.5" />
                Terlaris
              </span>
            )}
            <span className="scale-90 origin-top-left">
              <LevelBadge level={course.level} />
            </span>
          </div>
          {enrolled && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/70 to-transparent px-1.5 pb-1.5 pt-6">
              <Progress
                value={progressPercent}
                className="gap-0 [&_[data-slot=progress-indicator]]:bg-accent [&_[data-slot=progress-track]]:h-1 [&_[data-slot=progress-track]]:bg-muted/80"
                aria-label={`Progress ${progressPercent}% selesai`}
              />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-0.5 px-1.5 py-1.5">
          <h3 className="line-clamp-2 font-heading text-[11px] font-medium leading-tight">
            {course.title}
          </h3>
          {mentor && (
            <p className="course-card-poster-meta line-clamp-1 flex items-center gap-1 text-[9px] text-muted-foreground">
              <span className="truncate">{mentor.name}</span>
              {hasRating(course.rating) && (
                <>
                  <span aria-hidden>·</span>
                  <span className="inline-flex shrink-0 items-center gap-0.5 text-foreground/75">
                    <Star className="size-2.5 fill-foreground text-foreground" />
                    {formatRating(course.rating)}
                  </span>
                </>
              )}
            </p>
          )}
          <p className="course-card-poster-meta line-clamp-1 text-[10px] text-muted-foreground">
            {enrolled
              ? progressPercent >= 100
                ? "Selesai"
                : `${progressPercent}% · Lanjutkan`
              : formatRupiah(course.price)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "surface-card-hover @container group flex h-full w-full flex-col overflow-hidden",
        enrolled && "ring-1 ring-accent/25",
        className
      )}
    >
      <div className="relative aspect-[16/10]">
        <CourseThumbnail
          course={course}
          className="absolute inset-0"
          showPlayOverlay
          alt={course.title}
        />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {isBestseller && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-foreground shadow-sm">
              <Flame className="size-3" />
              Terlaris
            </span>
          )}
          <LevelBadge level={course.level} />
        </div>
        {enrolled && (
          <div className="absolute right-3 top-3">
            <span className="rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[10px] font-medium tracking-wide text-accent backdrop-blur-sm">
              Dimiliki
            </span>
          </div>
        )}
      </div>

      {enrolled && (
        <div className="border-t border-border/60 bg-white/[0.02] px-3 py-2">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Progress
            </span>
            <span className="font-mono text-[11px] font-medium tabular-nums text-accent">
              {progressPercent}% selesai
            </span>
          </div>
          <Progress
            value={progressPercent}
            className="gap-0 [&_[data-slot=progress-indicator]]:bg-accent [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-muted/80"
            aria-label={`Progress ${progressPercent}% selesai`}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-4">
        {mentor && (
          <div className="flex items-center gap-1.5">
            <Avatar className="size-5 border border-border/60 bg-surface-2">
              <AvatarFallback className="bg-surface-2 text-[9px] font-semibold">
                {mentor.initials}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs font-medium text-foreground/85">
              {mentor.name}
            </span>
            {mentor.verified && (
              <span
                className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"
                title="Mentor terverifikasi"
              >
                <BadgeCheck className="size-3" />
              </span>
            )}
          </div>
        )}
        <h3 className="line-clamp-2 font-heading text-sm font-semibold leading-snug @[240px]:text-base @[380px]:text-lg">
          {course.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
          <InstrumentBadge instrument={course.instrument} className="h-auto px-1.5 py-0.5 text-[10px]" />
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {course.durationHours} jam
          </span>
          {lessonCount !== undefined && (
            <span className="inline-flex items-center gap-1">
              <BookOpen className="size-3" />
              {lessonCount} pelajaran
            </span>
          )}
        </div>
        <div
          className={cn(
            "mt-auto flex items-center pt-2",
            hasRating(course.rating) ? "justify-between" : "justify-end"
          )}
        >
          <StarRating rating={course.rating} reviewCount={course.studentsCount} />
          {enrolled ? (
            <span className="text-xs font-medium text-accent">
              {progressPercent === 0
                ? "Mulai belajar"
                : progressPercent >= 100
                  ? "Selesai"
                  : "Lanjutkan"}
            </span>
          ) : (
            <span className="font-mono text-sm font-medium tabular-nums">
              {formatRupiah(course.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

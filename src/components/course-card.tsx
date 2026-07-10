"use client";

import Link from "next/link";
import { ArrowLeftRight, Bitcoin, LineChart, PlayCircle } from "lucide-react";

import { InstrumentBadge, LevelBadge } from "@/components/instrument-badge";
import { StarRating } from "@/components/star-rating";
import { Progress } from "@/components/ui/progress";
import { getMentorBySlug, formatRupiah } from "@/lib/mock-data";
import type { Course } from "@/lib/types";
import { cn } from "@/lib/utils";

const instrumentIcon = {
  Saham: LineChart,
  Crypto: Bitcoin,
  Forex: ArrowLeftRight,
} as const;

export type CourseCardEnrollment = {
  progressPercent: number;
  completedLessons?: number;
  totalLessons?: number;
  lastLessonId?: string;
};

export function CourseCard({
  course,
  className,
  enrollment,
}: {
  course: Course;
  className?: string;
  /** When set, card is treated as purchased/enrolled (progress under thumbnail). */
  enrollment?: CourseCardEnrollment | null;
}) {
  const mentor = getMentorBySlug(course.mentorSlug);
  const Icon = instrumentIcon[course.instrument];
  const enrolled = Boolean(enrollment);
  const progressPercent = Math.min(
    100,
    Math.max(0, enrollment?.progressPercent ?? 0)
  );
  const href =
    enrolled && enrollment?.lastLessonId
      ? `/belajar/${course.slug}/${enrollment.lastLessonId}`
      : `/kelas/${course.slug}`;

  return (
    <Link
      href={href}
      className={cn(
        "surface-card-hover group flex h-full w-full flex-col overflow-hidden",
        enrolled && "ring-1 ring-accent/25",
        className
      )}
    >
      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br from-surface-2 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--glow),transparent_60%)] opacity-50" />
        <Icon
          className="size-9 text-foreground/20 transition-transform duration-300 ease-out group-hover:scale-105"
          strokeWidth={1.5}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
          <PlayCircle className="size-9 text-foreground/90" />
        </div>
        <div className="absolute left-3 top-3">
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
        <InstrumentBadge instrument={course.instrument} className="w-fit" />
        <h3 className="line-clamp-2 font-heading text-sm font-medium leading-snug">
          {course.title}
        </h3>
        {mentor && (
          <p className="text-xs text-muted-foreground">
            oleh <span className="text-foreground/75">{mentor.name}</span>
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
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

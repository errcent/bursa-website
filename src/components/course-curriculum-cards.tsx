"use client";

import { useMemo } from "react";
import Link from "next/link";

import { BookmarkToggleButton } from "@/components/bookmark-toggle-button";
import { loadGuestVerifiedSeconds, loadGuestProgress } from "@/lib/learning/guest-progress-storage";
import { LessonPreviewThumb } from "@/components/video/lesson-preview-thumb";
import { useCourseEnrollment } from "@/hooks/use-course-enrollment";
import { belajarLessonHref } from "@/lib/learning/belajar-return-path";
import type { Course } from "@/lib/types";
import { isLessonFreePreview } from "@/lib/video/lesson-access";
import { cn } from "@/lib/utils";

interface CourseCurriculumCardsProps {
  course: Course;
  className?: string;
  /** Hide bookmark toggle (e.g. landing page device mockup). */
  hideBookmark?: boolean;
}

function formatDurationBadge(minutes: number): string {
  return `${minutes}:00`;
}

export function CourseCurriculumCards({
  course,
  className,
  hideBookmark = false,
}: CourseCurriculumCardsProps) {
  const { enrolled } = useCourseEnrollment(course.slug);

  const watchByLesson = useMemo(() => {
    const completed = loadGuestProgress(course.slug);
    const verified = loadGuestVerifiedSeconds(course.slug);
    const map: Record<string, number> = {};
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (completed.has(lesson.id)) {
          map[lesson.id] = 1;
          continue;
        }
        const durationSec = Math.max(lesson.durationMinutes * 60, 1);
        const watched = verified[lesson.id] ?? 0;
        if (watched > 0) map[lesson.id] = Math.min(1, watched / durationSec);
      }
    }
    return map;
  }, [course]);

  const flatVideos = course.modules.flatMap((module, moduleIndex) =>
    module.lessons.map((lesson, lessonIndex) => ({
      lesson,
      moduleIndex,
      lessonIndex,
    }))
  );

  return (
    <div className={cn("mx-auto flex w-full max-w-4xl flex-col", className)}>
      <div className="mx-auto flex w-full max-w-3xl flex-col divide-y divide-border/35">
        {flatVideos.map(({ lesson, moduleIndex, lessonIndex }) => {
          const isFree = isLessonFreePreview(lesson, moduleIndex, lessonIndex);
          const isPlayable = enrolled || isFree;
          const href = belajarLessonHref(course.slug, lesson.id, {
            returnPath: `/kelas/${course.slug}`,
          });

          return (
            <div
              key={lesson.id}
              className="group mx-auto grid w-full min-w-0 grid-cols-[minmax(0,7.25rem)_1fr] items-start gap-3 py-3 sm:grid-cols-[minmax(0,260px)_1fr] sm:gap-8 sm:py-4 lg:grid-cols-[minmax(0,300px)_1fr]"
            >
              <div className="relative min-w-0">
                <Link href={href} className="block min-w-0">
                  <LessonPreviewThumb
                    posterSrc={lesson.videoThumbnailUrl}
                    title={lesson.title}
                    isFree={isFree}
                    hasAccess={enrolled}
                    durationMinutes={lesson.durationMinutes}
                    durationLabel={formatDurationBadge(lesson.durationMinutes)}
                    size="lg"
                    showPlayOverlay={isPlayable}
                    durationPosition="bottom-right"
                    className="rounded-md border-border"
                    watchProgress={watchByLesson[lesson.id]}
                  />
                </Link>
              </div>

              <div className="flex min-w-0 flex-col justify-center gap-1">
                <div className="flex items-start justify-between gap-3">
                  <Link href={href} className="min-w-0 flex-1">
                    <h4 className="break-words font-heading text-sm font-medium leading-snug text-foreground sm:text-lg lg:text-xl">
                      {lesson.title}
                    </h4>
                  </Link>
                  {!hideBookmark ? (
                    <BookmarkToggleButton
                      bookmarkRef={{
                        type: "lesson",
                        courseSlug: course.slug,
                        lessonId: lesson.id,
                      }}
                      className="shrink-0 opacity-100"
                    />
                  ) : null}
                </div>
                {lesson.description ? (
                  <Link href={href}>
                    <p className="section-copy line-clamp-3 max-w-2xl break-words text-xs leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                      {lesson.description}
                    </p>
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

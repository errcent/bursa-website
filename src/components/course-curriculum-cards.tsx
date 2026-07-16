"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth-provider";
import { LessonPreviewThumb } from "@/components/video/lesson-preview-thumb";
import { useCourseEnrollment } from "@/hooks/use-course-enrollment";
import { buildLoginHref } from "@/lib/auth/redirect";
import type { Course } from "@/lib/types";
import { isLessonFreePreview } from "@/lib/video/lesson-access";

interface CourseCurriculumCardsProps {
  course: Course;
}

export function CourseCurriculumCards({ course }: CourseCurriculumCardsProps) {
  const { enrolled } = useCourseEnrollment(course.slug);
  const { session } = useAuth();
  const checkoutHref = `/checkout/${course.slug}`;
  const lockedHref = session ? checkoutHref : buildLoginHref(checkoutHref);

  const flatLessons = course.modules.flatMap((module, moduleIndex) =>
    module.lessons.map((lesson, lessonIndex) => ({
      lesson,
      module,
      moduleIndex,
      lessonIndex,
    }))
  );

  return (
    <div className="flex flex-col gap-6">
      {flatLessons.map(({ lesson, module, moduleIndex, lessonIndex }, index) => {
        const isFree = isLessonFreePreview(lesson, moduleIndex, lessonIndex);
        const isPlayable = enrolled || isFree;
        const href = isPlayable
          ? `/belajar/${course.slug}/${lesson.id}`
          : lockedHref;

        return (
          <Link
            key={lesson.id}
            href={href}
            className="group grid gap-4 border-b border-border/60 pb-6 transition-colors last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,280px)_1fr] sm:items-start lg:grid-cols-[minmax(0,320px)_1fr]"
          >
            <LessonPreviewThumb
              title={lesson.title}
              isFree={isFree}
              hasAccess={enrolled}
              durationMinutes={lesson.durationMinutes}
              size="lg"
              showPlayOverlay={isPlayable}
              className="rounded-xl"
            />

            <div className="flex min-w-0 flex-col gap-2 pt-0.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {String(index + 1).padStart(2, "0")} · {module.title}
              </p>
              <h3 className="font-heading text-lg font-medium leading-snug underline-offset-4 transition-colors group-hover:text-foreground group-hover:underline">
                {lesson.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {lesson.durationMinutes} menit
                {isFree ? " · Preview gratis" : ""}
                {!isPlayable ? " · Butuh akses kelas" : ""}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

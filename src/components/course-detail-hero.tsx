"use client";

import { useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";

import { CourseThumbnail } from "@/components/course-thumbnail";
import { DetailAboutInfoButton, DetailAboutSheet } from "@/components/detail/detail-about-sheet";
import { Button } from "@/components/ui/button";
import { useCourseEnrollment } from "@/hooks/use-course-enrollment";
import { courseOutcomesDescriptionParagraph } from "@/lib/courses/outcomes-copy";
import { belajarLessonHref } from "@/lib/learning/belajar-return-path";
import type { Course, Mentor } from "@/lib/types";

interface CourseDetailHeroProps {
  course: Course;
  mentor: Mentor | null;
  previewHref: string;
}

export function CourseDetailHero({
  course,
  mentor,
  previewHref,
}: CourseDetailHeroProps) {
  const { enrolled } = useCourseEnrollment(course.slug);
  const [aboutOpen, setAboutOpen] = useState(false);
  const kelasReturn = `/kelas/${course.slug}`;
  const learnHref = belajarLessonHref(course.slug, "l1", { returnPath: kelasReturn });
  const ctaHref = enrolled ? learnHref : previewHref;
  const ctaLabel = enrolled ? "Lanjut Belajar" : "Mulai Preview";
  const outcomesParagraph = courseOutcomesDescriptionParagraph(course.outcomes);

  return (
    <>
      <section className="relative w-full overflow-hidden bg-black">
        <div className="relative mx-auto w-full max-w-[1800px] overflow-hidden max-sm:h-[min(24rem,52svh)] max-sm:min-h-0 max-sm:aspect-auto sm:aspect-video sm:max-h-[78vh]">
          <CourseThumbnail
            course={course}
            fillSlot
            className="absolute inset-0 z-0"
          />

          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/95 via-black/45 to-transparent max-sm:from-black/88 max-sm:via-black/28 max-sm:to-black/5"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 z-[1] hidden bg-[linear-gradient(105deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.5)_42%,transparent_72%)] sm:block"
            aria-hidden
          />

          <div className="absolute inset-0 z-10 flex flex-col justify-end px-5 pb-6 max-sm:pt-14 sm:justify-start sm:px-8 sm:pb-12 sm:pt-0 lg:px-10 lg:pb-14">
            <div
              className="hidden min-h-[12rem] shrink-0 sm:block lg:min-h-[14rem]"
              aria-hidden
            />
            <div className="mr-auto w-full max-w-md sm:max-w-lg">
              <h1 className="font-heading text-[clamp(1.375rem,4.2vw,2.75rem)] font-semibold leading-[1.12] tracking-[-0.04em] text-white max-sm:line-clamp-3">
                {course.title}
              </h1>

              {mentor && (
                <p className="mt-2 text-xs font-normal tracking-wide text-white/45 sm:mt-3 sm:text-sm">
                  dengan{" "}
                  <Link
                    href={`/instruktur/${mentor.slug}`}
                    className="text-white/70 underline decoration-white/25 underline-offset-2 transition-colors hover:text-white hover:decoration-white/50"
                  >
                    {mentor.name}
                  </Link>
                </p>
              )}

              <div className="section-copy mt-4 hidden max-w-md space-y-3 text-[0.9375rem] leading-relaxed text-white/65 sm:block sm:text-base">
                <p>{course.shortDescription}</p>
                {outcomesParagraph ? <p>{outcomesParagraph}</p> : null}
              </div>

              <div className="mt-4 flex items-center gap-2.5 sm:mt-7 sm:gap-3">
                <Button
                  size="lg"
                  className="h-11 min-w-0 flex-1 gap-2 rounded-md bg-white px-4 text-sm font-semibold text-black shadow-lg shadow-black/25 hover:bg-white/92 sm:h-12 sm:flex-none sm:gap-2.5 sm:px-7"
                  render={<Link href={ctaHref} />}
                >
                  <Play className="size-4 shrink-0 fill-current" />
                  {ctaLabel}
                </Button>
                <DetailAboutInfoButton
                  className="lg:hidden"
                  onClick={() => setAboutOpen(true)}
                  label="Tentang kelas"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <DetailAboutSheet
        open={aboutOpen}
        onOpenChange={setAboutOpen}
        title="Tentang kelas"
        subtitle={mentor ? `dengan ${mentor.name}` : undefined}
      >
        <div className="space-y-3">
          <p>{course.shortDescription}</p>
          {outcomesParagraph ? <p>{outcomesParagraph}</p> : null}
        </div>
      </DetailAboutSheet>
    </>
  );
}

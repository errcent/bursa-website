"use client";

import Link from "next/link";
import { Play } from "lucide-react";

import { CourseThumbnail } from "@/components/course-thumbnail";
import { Button } from "@/components/ui/button";
import { useCourseEnrollment } from "@/hooks/use-course-enrollment";
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
  const learnHref = `/belajar/${course.slug}/l1`;
  const ctaHref = enrolled ? learnHref : previewHref;
  const ctaLabel = enrolled ? "Lanjut Belajar" : "Mulai Preview";

  return (
    <section className="relative w-full overflow-hidden bg-black">
      <div className="relative mx-auto w-full max-w-[1800px] overflow-hidden max-sm:min-h-[34rem] max-sm:aspect-auto sm:aspect-video sm:max-h-[78vh]">
        <CourseThumbnail
          course={course}
          fillSlot
          className="absolute inset-0 z-0"
        />

        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black via-black/50 to-transparent max-sm:via-black/35"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(105deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.5)_42%,transparent_72%)]"
          aria-hidden
        />

        <div className="absolute inset-0 z-10 flex flex-col px-5 pb-10 sm:px-8 sm:pb-12 lg:px-10 lg:pb-14">
          <div
            className="min-h-[14rem] shrink-0 sm:min-h-[12rem] lg:min-h-[14rem]"
            aria-hidden
          />
          <div className="mr-auto w-full max-w-md sm:max-w-lg">
            <h1 className="font-heading text-[clamp(1.75rem,4.2vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-white">
              {course.title}
            </h1>

            {mentor && (
              <p className="mt-3 text-sm font-normal tracking-wide text-white/45">
                dengan {mentor.name}
              </p>
            )}

            <p className="section-copy mt-4 max-w-md text-[0.9375rem] leading-relaxed text-white/65 sm:text-base">
              {course.shortDescription}
            </p>

            <div className="mt-7">
              <Button
                size="lg"
                className="h-12 gap-2.5 rounded-md bg-white px-7 text-sm font-semibold text-black shadow-lg shadow-black/25 hover:bg-white/92"
                render={<Link href={ctaHref} />}
              >
                <Play className="size-4 fill-current" />
                {ctaLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

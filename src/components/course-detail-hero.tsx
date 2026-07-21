"use client";

import { useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCourseEnrollment } from "@/hooks/use-course-enrollment";
import {
  AI_THUMBNAIL_HEIGHT,
  AI_THUMBNAIL_WIDTH,
} from "@/lib/thumbnails/constants";
import { resolveCourseThumbnailUrl, courseThumbnailFallbackApiPath } from "@/lib/courses/thumbnails";
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
  const posterUrl = resolveCourseThumbnailUrl(course);
  const [posterSrc, setPosterSrc] = useState(posterUrl);
  const ctaHref = enrolled ? learnHref : previewHref;
  const ctaLabel = enrolled ? "Lanjut Belajar" : "Mulai Preview";

  return (
    <section className="relative w-full overflow-hidden bg-black">
      <div className="relative mx-auto w-full max-w-[1800px] overflow-hidden max-sm:min-h-[34rem] max-sm:aspect-auto sm:aspect-[16/10] sm:max-h-[78vh]">
        {posterSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterSrc}
            alt=""
            aria-hidden
            width={AI_THUMBNAIL_WIDTH}
            height={AI_THUMBNAIL_HEIGHT}
            className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
            onError={() => {
              const fallback = courseThumbnailFallbackApiPath(course.slug);
              if (posterSrc !== fallback) setPosterSrc(fallback);
            }}
          />
        )}

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent max-sm:via-black/35"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.5)_42%,transparent_72%)]"
          aria-hidden
        />

        <div className="absolute inset-0 z-10 flex flex-col px-5 pb-10 sm:px-8 sm:pb-12 lg:px-12 lg:pb-14">
          <div
            className="min-h-[14rem] shrink-0 sm:min-h-[12rem] lg:min-h-[14rem]"
            aria-hidden
          />
          <div className="mx-auto w-full max-w-6xl">
            <div className="max-w-2xl">
              <h1 className="font-heading text-[clamp(2rem,5.5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-white">
                {course.title}
              </h1>

              {mentor && (
                <p className="mt-3 text-sm font-normal tracking-wide text-white/45">
                  dengan {mentor.name}
                </p>
              )}

              <p className="section-copy mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-white/65 sm:text-base">
                {course.shortDescription}
              </p>

              <div className="mt-7">
                <Button
                  size="lg"
                  className="h-12 gap-2.5 rounded-full bg-white px-7 text-sm font-semibold text-black shadow-lg shadow-black/25 hover:bg-white/92"
                  render={<Link href={ctaHref} />}
                >
                  <Play className="size-4 fill-current" />
                  {ctaLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

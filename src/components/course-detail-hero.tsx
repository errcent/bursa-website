"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Play, Users } from "lucide-react";

import { CourseTrailerPlayer } from "@/components/course-trailer-player";
import { InstrumentBadge, LevelBadge } from "@/components/instrument-badge";
import { VerifiedBadge } from "@/components/verified-badge";
import { StarRating } from "@/components/star-rating";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCourseEnrollment } from "@/hooks/use-course-enrollment";
import { resolveCourseThumbnailUrl } from "@/lib/courses/thumbnails";
import { KOMUNITAS_ENABLED } from "@/lib/features/komunitas";
import { cn, hasRating } from "@/lib/utils";
import type { Course, Mentor } from "@/lib/types";

interface CourseDetailHeroProps {
  course: Course;
  mentor: Mentor | null;
  totalLessons: number;
  priceLabel: string;
  checkoutHref: string;
  previewHref: string;
  ratingLabel: string;
}

export function CourseDetailHero({
  course,
  mentor,
  totalLessons,
  priceLabel,
  checkoutHref,
  previewHref,
  ratingLabel,
}: CourseDetailHeroProps) {
  const [trailerActive, setTrailerActive] = useState(false);
  const { enrolled } = useCourseEnrollment(course.slug);
  const learnHref = `/belajar/${course.slug}/l1`;
  const posterUrl = resolveCourseThumbnailUrl(course);

  return (
    <section className="relative w-full overflow-hidden bg-black">
      <div
        className={cn(
          "relative mx-auto w-full max-w-[1600px] transition-all duration-500",
          trailerActive ? "aspect-video max-h-[85vh]" : "aspect-[21/9] min-h-[420px] max-h-[78vh] sm:min-h-[480px] lg:min-h-[520px]"
        )}
      >
        {!trailerActive && posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 size-full object-cover object-top"
          />
        )}

        {!trailerActive && (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10"
            aria-hidden
          />
        )}
        {!trailerActive && (
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.55)_42%,transparent_72%)]"
            aria-hidden
          />
        )}

        <div
          className={cn(
            "absolute inset-0 z-10 h-full w-full",
            trailerActive ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          {trailerActive && (
            <CourseTrailerPlayer
              title={course.title}
              mentor={mentor}
              posterUrl={posterUrl}
              variant="cinema"
              autoStart
              className="size-full"
              onPlaybackChange={setTrailerActive}
            />
          )}
        </div>

        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end px-5 pb-8 pt-24 sm:px-8 sm:pb-10 lg:px-12 lg:pb-12",
            trailerActive && "pointer-events-none opacity-0"
          )}
        >
          <div className="mx-auto w-full max-w-[1600px]">
            <div className="max-w-2xl">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <InstrumentBadge instrument={course.instrument} />
                <LevelBadge level={course.level} />
              </div>

              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
                {mentor ? `Dengan ${mentor.name}` : "Kelas Bursa"}
              </p>
              <h1 className="mt-2 font-heading text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
                {course.title}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
                {course.shortDescription}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/60">
                {hasRating(course.rating) && <StarRating rating={course.rating} />}
                <span className="flex items-center gap-1.5">
                  <Users className="size-4" /> {course.studentsCount.toLocaleString("id-ID")} siswa
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" /> {course.durationHours} jam · {totalLessons} lesson
                </span>
                {ratingLabel ? <span className="sr-only">{ratingLabel}</span> : null}
              </div>

              {mentor && (
                <Link
                  href={`/instruktur/${mentor.slug}`}
                  className="mt-4 inline-flex max-w-full items-center gap-3 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 pr-4 backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-black/45"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-white/10 text-xs text-white">
                      {mentor.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 text-left">
                    <p className="truncate text-sm font-medium text-white">{mentor.name}</p>
                    <p className="truncate text-xs text-white/60">{mentor.title}</p>
                  </div>
                  <VerifiedBadge verified={mentor.verified} className="ml-1" />
                </Link>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {enrolled ? (
                  <>
                    <Button
                      size="lg"
                      className="h-11 gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/90"
                      render={<Link href={learnHref} />}
                    >
                      <Play className="size-4 fill-current" />
                      Lanjut Belajar
                    </Button>
                    {KOMUNITAS_ENABLED && (
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-11 rounded-full border-white/25 bg-white/10 px-6 text-white backdrop-blur hover:bg-white/15"
                        render={<Link href="/komunitas" />}
                      >
                        Komunitas
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="h-11 gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/90"
                      render={<Link href={previewHref} />}
                    >
                      <Play className="size-4 fill-current" />
                      Mulai Kelas
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-11 rounded-full border-white/25 bg-white/10 px-6 text-white backdrop-blur hover:bg-white/15"
                      onClick={() => setTrailerActive(true)}
                    >
                      Trailer
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="hidden h-11 rounded-full border-white/25 bg-white/10 px-6 text-white backdrop-blur hover:bg-white/15 sm:inline-flex"
                      render={<Link href={checkoutHref} />}
                    >
                      Checkout · {priceLabel}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

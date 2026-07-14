"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Clock, Users } from "lucide-react";

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

  return (
    <div
      className={cn(
        "container-page grid min-w-0 gap-10 py-14 transition-all duration-300 lg:py-16",
        trailerActive
          ? "lg:grid-cols-1"
          : "lg:grid-cols-[1.3fr_1fr]"
      )}
    >
      <div
        className={cn(
          "flex min-w-0 flex-col gap-4",
          trailerActive && "lg:order-2 lg:mx-auto lg:max-w-3xl lg:text-center"
        )}
      >
        <p className="eyebrow">Detail kelas</p>
        <div
          className={cn(
            "flex flex-wrap items-center gap-2",
            trailerActive && "lg:justify-center"
          )}
        >
          <InstrumentBadge instrument={course.instrument} />
          <LevelBadge level={course.level} />
        </div>
        <h1 className="page-hero-title break-words leading-tight">{course.title}</h1>
        <p className="section-copy break-words">{course.shortDescription}</p>
        <div
          className={cn(
            "flex flex-wrap gap-2",
            trailerActive && "lg:justify-center"
          )}
        >
          <span className="badge-pill border-emerald/30 bg-emerald/10 text-emerald">
            Belajar terstruktur dari mentor aktif
          </span>
          <span className="badge-muted">Bayar sekali per kelas (bukan per modul)</span>
        </div>
        <div
          className={cn(
            "flex flex-wrap items-center gap-4 text-sm text-muted-foreground",
            trailerActive && "lg:justify-center"
          )}
        >
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
            className={cn(
              "surface-card-hover flex w-full max-w-full items-center gap-3 p-3 pr-5 transition-colors hover:border-accent/30 sm:w-fit",
              trailerActive && "lg:mx-auto"
            )}
          >
            <Avatar>
              <AvatarFallback className="bg-surface-2 text-xs">{mentor.initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{mentor.name}</p>
              <p className="truncate text-xs text-muted-foreground">{mentor.title}</p>
            </div>
            <VerifiedBadge verified={mentor.verified} className="ml-2" />
          </Link>
        )}
      </div>

      <div
        className={cn(
          "flex min-w-0 flex-col gap-4",
          trailerActive && "lg:order-1 lg:mx-auto lg:w-full lg:max-w-5xl"
        )}
      >
        <CourseTrailerPlayer
          title={course.title}
          mentor={mentor}
          posterUrl={resolveCourseThumbnailUrl(course)}
          onPlaybackChange={setTrailerActive}
        />
        <div className={cn("surface-card p-5", trailerActive && "lg:mx-auto lg:w-full lg:max-w-md")}>
          {enrolled ? (
            <>
              <p className="text-sm font-medium text-emerald">Sudah berlangganan</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Akses kelas{KOMUNITAS_ENABLED ? " dan hub komunitas mentor" : ""} sudah aktif di akun
                Anda.
              </p>
              <Button className="btn-primary mt-4 w-full" render={<Link href={learnHref} />}>
                Lanjut Belajar
              </Button>
              {KOMUNITAS_ENABLED && (
                <Button variant="outline" className="mt-2 w-full" render={<Link href="/komunitas" />}>
                  Buka Komunitas
                </Button>
              )}
            </>
          ) : (
            <>
              <p className="font-mono text-2xl font-semibold tabular-nums">{priceLabel}</p>
              <p className="text-xs text-muted-foreground">
                Pembayaran langsung ke mentor untuk 1 kelas lengkap (bukan biaya per modul/lesson)
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald" /> Akses lifetime + update materi kelas
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald" /> Checkout sekali untuk seluruh kurikulum
                </li>
              </ul>
              <Button className="btn-primary mt-4 w-full" render={<Link href={checkoutHref} />}>
                Checkout Sekarang
              </Button>
              <Button variant="outline" className="mt-2 w-full" render={<Link href={previewHref} />}>
                Preview Lesson Gratis
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

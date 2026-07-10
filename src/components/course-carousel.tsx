"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef } from "react";

import { CourseCard } from "@/components/course-card";
import {
  SCROLL_CAROUSEL_GAP,
  ScrollCarousel,
  landingCourseGetScrollPerView,
  type ScrollCarouselHandle,
} from "@/components/scroll-carousel";
import { Button } from "@/components/ui/button";
import { useMobileLayout } from "@/hooks/use-mobile-layout";
import type { Course } from "@/lib/types";
import { cn } from "@/lib/utils";

const LANDING_CAROUSEL_GAP = 10;

interface CourseCarouselProps {
  courses: Course[];
  className?: string;
}

export function CourseCarousel({ courses, className }: CourseCarouselProps) {
  const isMobile = useMobileLayout();
  const carouselRef = useRef<ScrollCarouselHandle>(null);

  if (courses.length === 0) return null;

  const cardVariant = isMobile ? "poster" : "default";

  return (
    <div className={cn("relative", className)}>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Pilihan kelas</p>
          <h2 className="section-title sm:text-3xl">Kelas populer</h2>
          <p className="section-copy mt-2 max-w-lg">
            Kelas yang paling sering dipilih siswa.
          </p>
          <Link href="/katalog" className="link-accent mt-3 inline-flex items-center gap-1 text-sm">
            Lihat semua kelas
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-full"
            onClick={() => carouselRef.current?.scrollByStep(-1)}
            aria-label="Kelas sebelumnya"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-full"
            onClick={() => carouselRef.current?.scrollByStep(1)}
            aria-label="Kelas berikutnya"
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className={cn(isMobile && "landing-carousel-bleed")}>
        <ScrollCarousel
          ref={carouselRef}
          ariaLabel="Kelas unggulan"
          hideArrows
          viewportClassName="landing-scroll-carousel"
          getPerView={landingCourseGetScrollPerView}
          fixedItemWidth={isMobile ? "var(--landing-course-card-width)" : undefined}
          gap={isMobile ? LANDING_CAROUSEL_GAP : SCROLL_CAROUSEL_GAP}
        >
          {courses.map((course) => (
            <CourseCard key={course.slug} course={course} variant={cardVariant} className="w-full" />
          ))}
        </ScrollCarousel>
      </div>
    </div>
  );
}

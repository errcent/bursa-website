"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { CourseCard } from "@/components/course-card";
import {
  SCROLL_CAROUSEL_GAP,
  ScrollCarousel,
  landingCourseGetScrollPerView,
  peekGetScrollPerView,
  type ScrollCarouselHandle,
} from "@/components/scroll-carousel";
import { Button } from "@/components/ui/button";
import { useMobileLayout } from "@/hooks/use-mobile-layout";
import type { Course } from "@/lib/types";
import { cn } from "@/lib/utils";

const LANDING_MOBILE_GAP = 10;

interface CourseCarouselProps {
  courses: Course[];
  className?: string;
  /** Total students across the full catalog, surfaced as a real stat in the header. */
  totalStudents?: number;
}

export function CourseCarousel({ courses, className, totalStudents }: CourseCarouselProps) {
  const isMobile = useMobileLayout();
  const desktopCarouselRef = useRef<ScrollCarouselHandle>(null);
  const mobileCarouselRef = useRef<ScrollCarouselHandle>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const applyScrollState = useCallback(
    (state: { canScrollLeft: boolean; canScrollRight: boolean }) => {
      setCanScrollLeft(state.canScrollLeft);
      setCanScrollRight(state.canScrollRight);
    },
    []
  );

  const scrollByStep = useCallback(
    (direction: -1 | 1) => {
      const handle = isMobile ? mobileCarouselRef.current : desktopCarouselRef.current;
      handle?.scrollByStep(direction);
    },
    [isMobile]
  );

  const scrollToIndex = useCallback(
    (index: number) => {
      const handle = isMobile ? mobileCarouselRef.current : desktopCarouselRef.current;
      handle?.scrollToIndex(index);
    },
    [isMobile]
  );

  if (courses.length === 0) return null;

  const studentStat =
    totalStudents !== undefined && totalStudents > 0
      ? `${totalStudents.toLocaleString("id-ID")}+`
      : null;

  return (
    <div className={cn("relative min-w-0", className)}>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Pilihan kelas</p>
          <h2 className="section-title sm:text-3xl">Kelas populer</h2>
          <p className="section-copy mt-2 max-w-lg">
            Kelas yang paling sering dipilih siswa
            {studentStat && (
              <>
                {" "}
                — dipercaya <span className="font-medium text-foreground">{studentStat} siswa</span> aktif belajar di Bursa.
              </>
            )}
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
            onClick={() => scrollByStep(-1)}
            disabled={!canScrollLeft}
            aria-label="Kelas sebelumnya"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-full"
            onClick={() => scrollByStep(1)}
            disabled={!canScrollRight}
            aria-label="Kelas berikutnya"
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="landing-carousel-bleed md:hidden">
        <ScrollCarousel
          ref={mobileCarouselRef}
          ariaLabel="Kelas unggulan"
          hideArrows
          viewportClassName="landing-scroll-carousel"
          getPerView={peekGetScrollPerView}
          gap={LANDING_MOBILE_GAP}
          onScrollStateChange={(state) => {
            if (isMobile) applyScrollState(state);
          }}
          onActiveIndexChange={(index) => {
            if (isMobile) setActiveIndex(index);
          }}
        >
          {courses.map((course, index) => (
            <CourseCard
              key={course.slug}
              course={course}
              variant="poster"
              isBestseller={index === 0}
            />
          ))}
        </ScrollCarousel>
      </div>

      <div className="landing-carousel-bleed hidden min-w-0 md:block">
        <ScrollCarousel
          ref={desktopCarouselRef}
          ariaLabel="Kelas unggulan"
          hideArrows
          viewportClassName="landing-scroll-carousel"
          getPerView={landingCourseGetScrollPerView}
          gap={SCROLL_CAROUSEL_GAP}
          onScrollStateChange={(state) => {
            if (!isMobile) applyScrollState(state);
          }}
          onActiveIndexChange={(index) => {
            if (!isMobile) setActiveIndex(index);
          }}
        >
          {courses.map((course, index) => (
            <CourseCard
              key={course.slug}
              course={course}
              className="w-full"
              isBestseller={index === 0}
            />
          ))}
        </ScrollCarousel>
      </div>

      {courses.length > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3 sm:mt-6">
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Navigasi kelas populer">
            {courses.map((course, index) => (
              <button
                key={course.slug}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-current={index === activeIndex}
                aria-label={`Ke kelas ${index + 1}: ${course.title}`}
                onClick={() => scrollToIndex(index)}
                className="carousel-dot"
              />
            ))}
          </div>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {activeIndex + 1}/{courses.length}
          </span>
        </div>
      )}
    </div>
  );
}

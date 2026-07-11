"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

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

function readScrollState(el: HTMLElement) {
  const { scrollLeft, scrollWidth, clientWidth } = el;
  return {
    canScrollLeft: scrollLeft > 2,
    canScrollRight: scrollLeft < scrollWidth - clientWidth - 2,
  };
}

export function CourseCarousel({ courses, className }: CourseCarouselProps) {
  const isMobile = useMobileLayout();
  const desktopCarouselRef = useRef<ScrollCarouselHandle>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const applyScrollState = useCallback(
    (state: { canScrollLeft: boolean; canScrollRight: boolean }) => {
      setCanScrollLeft(state.canScrollLeft);
      setCanScrollRight(state.canScrollRight);
    },
    []
  );

  const syncMobileScrollState = useCallback(() => {
    const el = mobileScrollRef.current;
    if (!el) return;
    applyScrollState(readScrollState(el));
  }, [applyScrollState]);

  useLayoutEffect(() => {
    if (!isMobile) return;
    syncMobileScrollState();
    const el = mobileScrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(syncMobileScrollState);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobile, syncMobileScrollState, courses.length]);

  const scrollByStep = useCallback(
    (direction: -1 | 1) => {
      if (isMobile) {
        const el = mobileScrollRef.current;
        if (!el) return;
        const first = el.firstElementChild as HTMLElement | null;
        const stride = first
          ? first.offsetWidth + LANDING_CAROUSEL_GAP
          : el.clientWidth * 0.8;
        el.scrollBy({ left: direction * stride, behavior: "smooth" });
        return;
      }
      desktopCarouselRef.current?.scrollByStep(direction);
    },
    [isMobile]
  );

  if (courses.length === 0) return null;

  return (
    <div className={cn("relative min-w-0", className)}>
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
        <div
          ref={mobileScrollRef}
          className="catalog-row-scroll landing-course-row-scroll"
          aria-label="Kelas unggulan"
          onScroll={syncMobileScrollState}
        >
          {courses.map((course) => (
            <CourseCard key={course.slug} course={course} variant="poster" />
          ))}
        </div>
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
        >
          {courses.map((course) => (
            <CourseCard key={course.slug} course={course} className="w-full" />
          ))}
        </ScrollCarousel>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion, useTransform } from "motion/react";

import { CourseCard } from "@/components/course-card";
import {
  InfiniteCarouselViewport,
  useInfiniteCarousel,
  type InfiniteCarouselSlideProps,
} from "@/components/infinite-carousel";
import { Button } from "@/components/ui/button";
import { useMobileLayout } from "@/hooks/use-mobile-layout";
import type { Course } from "@/lib/types";
import { cn } from "@/lib/utils";

const LANDING_CAROUSEL_GAP = 10;

interface CourseCarouselProps {
  courses: Course[];
  className?: string;
}

function CourseCarouselSlide({
  course,
  index,
  itemWidth,
  containerWidth,
  x,
  reducedMotion,
  gap,
  variant,
}: InfiniteCarouselSlideProps & { course: Course; variant?: "default" | "poster" }) {
  const stride = itemWidth + gap;

  const scale = useTransform(x, (latest) => {
    if (reducedMotion || containerWidth <= 0 || itemWidth <= 0) return 1;
    const itemCenter = index * stride + itemWidth / 2 + latest;
    const dist = Math.abs(itemCenter - containerWidth / 2);
    const t = Math.min(dist / (containerWidth * 0.52), 1);
    return 1 - t * 0.06;
  });

  const opacity = useTransform(x, (latest) => {
    if (reducedMotion || containerWidth <= 0 || itemWidth <= 0) return 1;
    const itemCenter = index * stride + itemWidth / 2 + latest;
    const dist = Math.abs(itemCenter - containerWidth / 2);
    const t = Math.min(dist / (containerWidth * 0.58), 1);
    return 1 - t * 0.2;
  });

  return (
    <motion.div
      style={{
        scale,
        opacity,
      }}
      className="w-full origin-center will-change-transform"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <CourseCard course={course} variant={variant} className="w-full" />
    </motion.div>
  );
}

export function CourseCarousel({ courses, className }: CourseCarouselProps) {
  const isMobile = useMobileLayout();
  const carousel = useInfiniteCarousel({
    items: courses,
    ariaLabel: "Kelas unggulan",
    fixedItemWidth: isMobile ? "var(--landing-course-card-width)" : null,
    gap: isMobile ? LANDING_CAROUSEL_GAP : undefined,
  });

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
            onClick={() => carousel.nudge(1)}
            aria-label="Kelas sebelumnya"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-full"
            onClick={() => carousel.nudge(-1)}
            aria-label="Kelas berikutnya"
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className={cn(isMobile && "landing-carousel-bleed")}>
        <InfiniteCarouselViewport
          carousel={carousel}
          getItemKey={(course, i) => `${course.slug}-${i}`}
          getDotLabel={(i) => `Ke kelas ${i + 1}`}
          liveRegionLabel={(index, course) =>
            `Kelas ${index + 1} dari ${courses.length}: ${course.title}`
          }
          renderSlide={(course, slideProps) => (
            <CourseCarouselSlide course={course} variant={cardVariant} {...slideProps} />
          )}
        />
      </div>
    </div>
  );
}

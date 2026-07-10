"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import {
  InfiniteCarouselViewport,
  useInfiniteCarousel,
} from "@/components/infinite-carousel";
import { MentorCard } from "@/components/mentor-card";
import { Button } from "@/components/ui/button";
import { useMobileLayout } from "@/hooks/use-mobile-layout";
import type { Mentor } from "@/lib/types";
import { cn } from "@/lib/utils";

const LANDING_CAROUSEL_GAP = 10;

interface MentorCarouselProps {
  mentors: Mentor[];
  className?: string;
}

function mentorGetPerView(width: number) {
  if (width >= 1280) return 6;
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  if (width >= 640) return 2;
  return 1;
}

export function MentorCarousel({ mentors, className }: MentorCarouselProps) {
  const isMobile = useMobileLayout();
  const carousel = useInfiniteCarousel({
    items: mentors,
    ariaLabel: "Mentor di platform",
    getPerView: mentorGetPerView,
    fixedItemWidth: isMobile ? "var(--landing-mentor-card-width)" : null,
    gap: isMobile ? LANDING_CAROUSEL_GAP : undefined,
    autoScrollPxPerSec: 36,
  });

  if (mentors.length === 0) return null;

  const cardVariant = isMobile ? "compact" : "default";

  return (
    <div className={cn("relative", className)}>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Mentor</p>
          <h2 className="section-title sm:text-3xl">Mentor terverifikasi</h2>
          <p className="section-copy mt-2 max-w-lg">
            Praktisi saham, crypto, dan forex yang sudah lolos proses verifikasi.
          </p>
          <Link
            href="/katalog?view=instruktur"
            className="link-accent mt-3 inline-flex items-center gap-1 text-sm"
          >
            Buka katalog mentor
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-full"
            onClick={() => carousel.nudge(1)}
            aria-label="Mentor sebelumnya"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-full"
            onClick={() => carousel.nudge(-1)}
            aria-label="Mentor berikutnya"
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className={cn(isMobile && "landing-carousel-bleed")}>
        <InfiniteCarouselViewport
          carousel={carousel}
          getItemKey={(mentor, i) => `${mentor.slug}-${i}`}
          getDotLabel={(i) => `Ke mentor ${i + 1}`}
          liveRegionLabel={(index, mentor) =>
            `Mentor ${index + 1} dari ${mentors.length}: ${mentor.name}`
          }
          renderSlide={(mentor) => (
            <div
              className="h-full w-full"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MentorCard mentor={mentor} variant={cardVariant} className="h-full w-full" />
            </div>
          )}
        />
      </div>
    </div>
  );
}

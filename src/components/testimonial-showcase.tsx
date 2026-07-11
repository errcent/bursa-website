"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { ScrollCarousel } from "@/components/scroll-carousel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Review } from "@/lib/types";
import { cn, formatRating } from "@/lib/utils";

const TILT_LAYOUTS = [
  {
    rotate: -2,
    hoverRotate: -0.5,
    hoverY: -5,
    zIndex: 1,
    origin: "bottom left",
  },
  {
    rotate: 0,
    hoverRotate: 0,
    hoverY: -6,
    zIndex: 3,
    origin: "center",
  },
  {
    rotate: 2,
    hoverRotate: 0.5,
    hoverY: -5,
    zIndex: 2,
    origin: "bottom right",
  },
] as const;

const cardTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

interface TestimonialShowcaseProps {
  reviews: Review[];
  className?: string;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function TiltedReviewCard({ review, index }: { review: Review; index: number }) {
  const prefersReducedMotion = useReducedMotion();
  const layout = TILT_LAYOUTS[index % TILT_LAYOUTS.length];

  const cardInner = (
    <div
      className={cn(
        "testimonial-tilt-card surface-card flex h-full min-h-0 flex-col p-4 sm:min-h-[180px] sm:p-6",
        "border-border/80 bg-card/90 shadow-[0_4px_24px_rgba(0,0,0,0.18),0_0_0_1px_rgba(163,163,163,0.04)]",
        "transition-[border-color,box-shadow] duration-300",
        "group-hover:border-[rgba(163,163,163,0.22)]",
        "group-hover:shadow-[0_0_0_1px_rgba(163,163,163,0.06),0_16px_48px_rgba(0,0,0,0.42),0_0_24px_rgba(163,163,163,0.08)]"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-xs font-medium">
          <Star className="size-3.5 fill-foreground text-foreground" />
          {formatRating(review.rating)}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/70">{review.date}</span>
      </div>
      <p className="line-clamp-4 flex-1 text-sm leading-relaxed text-muted-foreground/95">
        {review.comment}
      </p>
      {review.courseTag || review.mentorTag ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {review.courseTag ? (
            <span className="badge-muted truncate">{review.courseTag}</span>
          ) : null}
          {review.mentorTag ? (
            <span className="badge-muted truncate">{review.mentorTag}</span>
          ) : null}
        </div>
      ) : null}
      <footer className="mt-4 flex items-center gap-2 border-t border-border/50 pt-3">
        <Avatar className="size-7 border border-border/80 bg-surface-2">
          <AvatarFallback className="bg-surface-2 text-[10px] font-medium">
            {review.initials}
          </AvatarFallback>
        </Avatar>
        <p className="text-sm font-medium text-foreground/90">{review.name}</p>
      </footer>
    </div>
  );

  if (prefersReducedMotion) {
    return (
      <div
        className="testimonial-tilt-item group h-full shrink-0 sm:w-auto sm:min-w-0 sm:flex-1"
        style={{
          zIndex: layout.zIndex,
          transform: `rotate(${layout.rotate}deg)`,
          transformOrigin: layout.origin,
        }}
      >
        {cardInner}
      </div>
    );
  }

  return (
    <motion.div
      className="testimonial-tilt-item group h-full shrink-0 sm:w-auto sm:min-w-0 sm:flex-1"
      style={{ zIndex: layout.zIndex, transformOrigin: layout.origin }}
      initial={false}
      animate={{ rotate: layout.rotate }}
      whileHover={{
        rotate: layout.hoverRotate,
        y: layout.hoverY,
        scale: 1.02,
      }}
      transition={cardTransition}
    >
      {cardInner}
    </motion.div>
  );
}

export function TestimonialShowcase({
  reviews,
  className,
}: TestimonialShowcaseProps) {
  const deckItems = reviews.slice(0, 3);
  const [activeIndex, setActiveIndex] = useState(0);
  const avgRating = average(reviews.map((r) => r.rating));

  return (
    <section className={cn("testimonial-showcase relative overflow-x-hidden", className)}>
      <div className="container-page relative z-10">
        <Reveal className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-2">Testimoni</p>
            <h2 className="section-title sm:text-3xl">Ulasan pengalaman belajar</h2>
            {avgRating > 0 ? (
              <div className="mt-2 flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm font-semibold">
                  <Star className="size-4 fill-foreground text-foreground" />
                  {formatRating(avgRating)}
                </span>
                <span className="text-sm text-muted-foreground">
                  dari {reviews.length} ulasan pengguna beta
                </span>
              </div>
            ) : null}
            <p className="section-copy mt-2 max-w-lg">
              Ulasan pengguna beta tentang materi dan proses belajar, bukan klaim hasil trading.
            </p>
          </div>
          <Link
            href="/katalog"
            className="inline-flex h-10 items-center gap-1 rounded-full border border-border/70 bg-card/40 px-5 text-sm font-medium text-foreground transition-colors hover:bg-card/70"
          >
            Lihat Katalog
            <ArrowRight className="size-4" />
          </Link>
        </Reveal>

        <Stagger className="space-y-6 sm:space-y-8">
          <StaggerItem>
            <div className="sm:hidden">
              <ScrollCarousel
                ariaLabel="Ulasan pengalaman belajar"
                naturalItemWidth
                hideArrows
                gap={12}
                viewportClassName="landing-scroll-carousel testimonial-scroll-carousel"
                onActiveIndexChange={setActiveIndex}
              >
                {deckItems.map((review, index) => (
                  <TiltedReviewCard key={review.name} review={review} index={index} />
                ))}
              </ScrollCarousel>
            </div>
            <div className="testimonial-tilt-row hidden sm:block sm:mx-0 sm:px-0">
              <div className="flex min-w-0 w-full items-stretch justify-center">
                {deckItems.map((review, index) => (
                  <div
                    key={review.name}
                    className={cn("sm:flex-1", index > 0 && "sm:-ml-3 md:-ml-4")}
                  >
                    <TiltedReviewCard review={review} index={index} />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-2 sm:hidden" aria-hidden>
              {deckItems.map((review, index) => (
                <span
                  key={`dot-${review.name}`}
                  className={cn(
                    "size-2 rounded-full transition-colors",
                    index === activeIndex ? "bg-accent" : "bg-muted-foreground/35"
                  )}
                />
              ))}
            </div>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}

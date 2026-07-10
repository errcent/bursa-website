"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
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
  founderResponse: string;
  className?: string;
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

function FeaturedFounderResponseCard({ response }: { response: string }) {
  const prefersReducedMotion = useReducedMotion();

  const card = (
    <div
      className={cn(
        "testimonial-featured-card surface-card relative overflow-hidden px-4 py-6 text-center sm:px-10 sm:py-8",
        "border-border/80 bg-card/90 shadow-[0_4px_32px_rgba(0,0,0,0.22),0_0_0_1px_rgba(163,163,163,0.05)]",
        "transition-[border-color,box-shadow,transform] duration-300",
        "hover:border-[rgba(163,163,163,0.22)]",
        "hover:shadow-[0_0_0_1px_rgba(163,163,163,0.06),0_20px_56px_rgba(0,0,0,0.48),0_0_28px_rgba(163,163,163,0.08)]"
      )}
    >
      <span
        className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 font-serif text-5xl leading-none text-foreground/15 sm:text-6xl"
        aria-hidden
      >
        &ldquo;
      </span>
      <blockquote className="relative mx-auto max-w-2xl">
        <p className="font-heading text-base font-medium leading-relaxed sm:text-lg">
          {response}
        </p>
        <footer className="mt-5">
          <cite className="not-italic font-mono text-xs tracking-wide text-muted-foreground">
            — Founder Bursa
          </cite>
        </footer>
      </blockquote>
    </div>
  );

  if (prefersReducedMotion) {
    return card;
  }

  return (
    <motion.div
      initial={false}
      whileHover={{ y: -4 }}
      transition={cardTransition}
    >
      {card}
    </motion.div>
  );
}

export function TestimonialShowcase({
  reviews,
  founderResponse,
  className,
}: TestimonialShowcaseProps) {
  const deckItems = reviews.slice(0, 3);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const cardWidth = el.firstElementChild?.clientWidth ?? 1;
      const index = Math.round(el.scrollLeft / Math.max(cardWidth, 1));
      setActiveIndex(Math.min(Math.max(index, 0), deckItems.length - 1));
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [deckItems.length]);

  return (
    <section className={cn("testimonial-showcase relative overflow-x-hidden", className)}>
      <div className="container-page relative z-10">
        <Reveal className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-2">Testimoni</p>
            <h2 className="section-title sm:text-3xl">Ulasan pengalaman belajar</h2>
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
            <div
              ref={scrollRef}
              className="testimonial-tilt-row -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:overflow-visible sm:px-0"
            >
              <div className="flex min-w-min items-stretch justify-start gap-3 sm:min-w-0 sm:w-full sm:justify-center">
                {deckItems.map((review, index) => (
                  <div
                    key={review.name}
                    className={cn(
                      "shrink-0 sm:flex-1",
                      index > 0 && "sm:-ml-3 md:-ml-4"
                    )}
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

          <StaggerItem>
            <FeaturedFounderResponseCard response={founderResponse} />
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}

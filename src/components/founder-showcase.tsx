"use client";

import Link from "next/link";
import { ArrowRight, PenLine } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { ScrollCarousel } from "@/components/scroll-carousel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { FounderProfile, FounderResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

const TILT_LAYOUTS = [
  {
    rotate: -4.5,
    hoverRotate: -1,
    hoverY: -10,
    zIndex: 1,
    origin: "bottom left",
  },
  {
    rotate: 0,
    hoverRotate: 0,
    hoverY: -12,
    zIndex: 3,
    origin: "center",
  },
  {
    rotate: 4.5,
    hoverRotate: 1,
    hoverY: -10,
    zIndex: 2,
    origin: "bottom right",
  },
] as const;

const cardTransition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };

interface FounderShowcaseProps {
  founder: FounderProfile;
  responses: FounderResponse[];
  manifesto: string;
  className?: string;
}

function TiltedResponseCard({
  item,
  founder,
  index,
}: {
  item: FounderResponse;
  founder: FounderProfile;
  index: number;
}) {
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
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="badge-pill max-w-[85%] truncate">{item.topic}</span>
        <PenLine
          className="size-4 shrink-0 text-accent/50"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
      <p className="line-clamp-4 flex-1 text-sm leading-relaxed text-muted-foreground">
        {item.response}
      </p>
      <footer className="mt-4 flex items-center gap-2 border-t border-border/50 pt-3">
        <Avatar className="size-7 border border-border/80 bg-surface-2">
          <AvatarFallback className="bg-surface-2 text-[10px] font-medium">
            {founder.initials}
          </AvatarFallback>
        </Avatar>
        <p className="font-mono text-[11px] text-muted-foreground">
          <span className="text-foreground/90">{founder.name}</span>
          <span className="text-muted-foreground/60"> · founder</span>
        </p>
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

function FeaturedManifestoCard({
  manifesto,
  founder,
}: {
  manifesto: string;
  founder: FounderProfile;
}) {
  const prefersReducedMotion = useReducedMotion();

  const card = (
    <div
      className={cn(
        "testimonial-featured-card surface-card relative overflow-hidden px-6 py-10 text-center sm:px-12 sm:py-14",
        "border-border/80 bg-card/90 shadow-[0_4px_32px_rgba(0,0,0,0.22),0_0_0_1px_rgba(163,163,163,0.05)]",
        "transition-[border-color,box-shadow,transform] duration-300",
        "hover:border-[rgba(163,163,163,0.22)]",
        "hover:shadow-[0_0_0_1px_rgba(163,163,163,0.06),0_20px_56px_rgba(0,0,0,0.48),0_0_28px_rgba(163,163,163,0.08)]"
      )}
    >
      <span
        className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 font-serif text-7xl leading-none text-foreground/15 sm:top-6 sm:text-8xl"
        aria-hidden
      >
        &ldquo;
      </span>
      <blockquote className="relative mx-auto max-w-3xl">
        <p className="font-heading text-lg font-medium leading-relaxed sm:text-xl md:text-2xl">
          {manifesto}
        </p>
        <footer className="mt-8 flex flex-col items-center gap-2">
          <Avatar className="size-10 border border-border/80 bg-surface-2 ring-2 ring-accent/20">
            <AvatarFallback className="bg-surface-2 text-xs font-medium">
              {founder.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <cite className="not-italic text-sm font-medium">{founder.name}</cite>
            <p className="font-mono text-xs text-muted-foreground">{founder.role}</p>
          </div>
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

export function FounderShowcase({
  founder,
  responses,
  manifesto,
  className,
}: FounderShowcaseProps) {
  const deckItems = responses.slice(0, 3);

  return (
    <section className={cn("testimonial-showcase relative overflow-x-hidden", className)}>
      <div className="container-page relative z-10">
        <Reveal className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-2">Dari founder</p>
            <h2 className="section-title sm:text-3xl">Kenapa Bursa saya bangun</h2>
            <p className="section-copy mt-2 max-w-lg">
              Bukan testimoni pelanggan — ini jawaban langsung dari saya tentang visi, batasan, dan
              harapan ke platform ini.
            </p>
          </div>
          <Button
            variant="outline"
            className="h-10 shrink-0 rounded-full px-5"
            render={<Link href="/katalog" />}
          >
            Mulai jelajahi
            <ArrowRight className="size-4" />
          </Button>
        </Reveal>

        <Stagger className="space-y-6 sm:space-y-8">
          <StaggerItem>
            <div className="sm:hidden">
              <ScrollCarousel
                ariaLabel="Jawaban dari founder"
                naturalItemWidth
                hideArrows
                gap={12}
                viewportClassName="landing-scroll-carousel testimonial-scroll-carousel"
              >
                {deckItems.map((item, index) => (
                  <TiltedResponseCard key={item.id} item={item} founder={founder} index={index} />
                ))}
              </ScrollCarousel>
            </div>
            <div className="testimonial-tilt-row hidden sm:block sm:mx-0 sm:px-0">
              <div className="flex min-w-0 w-full items-stretch justify-center">
                {deckItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={cn("sm:flex-1", index > 0 && "sm:-ml-7 md:-ml-8")}
                  >
                    <TiltedResponseCard item={item} founder={founder} index={index} />
                  </div>
                ))}
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <FeaturedManifestoCard manifesto={manifesto} founder={founder} />
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}

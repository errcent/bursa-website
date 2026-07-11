"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { FounderProfile, FounderResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FounderStorySectionProps {
  founder: FounderProfile;
  manifesto: string;
  responses: FounderResponse[];
  className?: string;
}

/**
 * Manifesto pull-quote + photo layout. Deliberately not another tilted card
 * deck — this section is about a single voice, not a stack of testimonials.
 */
export function FounderStorySection({
  founder,
  manifesto,
  responses,
  className,
}: FounderStorySectionProps) {
  const prefersReducedMotion = useReducedMotion();

  const photoPanel = (
    <div className="relative flex aspect-square w-full max-w-xs items-center justify-center overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-accent-soft/60 via-card to-surface/60 sm:max-w-sm lg:aspect-auto lg:h-full">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 20%, var(--glow-strong), transparent 70%)",
        }}
      />
      <Avatar className="relative z-10 size-28 border-2 border-border/80 bg-surface-2 shadow-[0_8px_32px_rgba(0,0,0,0.18)] sm:size-36">
        <AvatarFallback className="bg-surface-2 font-heading text-3xl font-semibold sm:text-4xl">
          {founder.initials}
        </AvatarFallback>
      </Avatar>
      <span className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {founder.role}
      </span>
    </div>
  );

  return (
    <section className={cn("founder-story-section relative overflow-hidden border-b border-border/60 section-loose", className)}>
      <div className="container-page relative z-10">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <p className="eyebrow mb-3">Founder story</p>
          <h2 className="section-title sm:text-3xl">Kenapa Bursa saya bangun</h2>
        </Reveal>

        <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <Reveal className="flex justify-center lg:justify-start">
            {prefersReducedMotion ? (
              photoPanel
            ) : (
              <motion.div
                className="w-full max-w-xs sm:max-w-sm lg:h-full"
                initial={{ rotate: -1.5 }}
                whileHover={{ rotate: 0, scale: 1.015 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {photoPanel}
              </motion.div>
            )}
          </Reveal>

          <Reveal delay={0.1} y={20}>
            <blockquote className="relative">
              <span
                className="pointer-events-none absolute -left-1 -top-6 font-serif text-6xl leading-none text-foreground/10 sm:-top-8 sm:text-7xl"
                aria-hidden
              >
                &ldquo;
              </span>
              <p className="relative font-heading text-lg font-medium leading-relaxed sm:text-xl md:text-2xl">
                {manifesto}
              </p>
              <footer className="mt-5">
                <cite className="not-italic text-sm font-medium">{founder.name}</cite>
                <p className="font-mono text-xs text-muted-foreground">{founder.role}</p>
              </footer>
            </blockquote>

            <Stagger className="mt-8 space-y-3 border-t border-border/50 pt-6" delay={0.1}>
              {responses.slice(0, 3).map((item) => (
                <StaggerItem key={item.id}>
                  <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                    <p className="shrink-0 font-mono text-xs uppercase tracking-wide text-accent sm:w-40">
                      {item.topic}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.response}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            <div className="mt-8">
              <Button variant="outline" className="h-10 rounded-full px-5" render={<Link href="/tentang-kami" />}>
                Baca lebih lanjut
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

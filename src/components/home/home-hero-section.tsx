"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";

import { HeroLivingBackground } from "@/components/hero-living-bg";
import { HeroNavSlot } from "@/components/hero-nav-slot";
import { HERO_HEADLINE_BASE_DELAY } from "@/components/motion/hero-intro-timing";
import { useHeroIntroReady } from "@/components/motion/use-hero-intro-ready";
import {
  HERO_HEADLINE_REVEAL_LINES,
  HeroRotatingTitle,
} from "@/components/motion/hero-rotating-title";
import { RevealText } from "@/components/motion/reveal";
import {
  tokenizeForReveal,
  WORD_REVEAL_DURATION,
  WORD_REVEAL_STAGGER,
  WordReveal,
} from "@/components/motion/word-reveal";
import { SiteNavbar } from "@/components/site-navbar";
import { Button } from "@/components/ui/button";

const HERO_SUBCOPY = "Kurikulum runut, bersama praktisi & mentor profesional";

function resolveSubcopyDelay(): number {
  const totalWords = HERO_HEADLINE_REVEAL_LINES.reduce(
    (sum, line) => sum + tokenizeForReveal(line).length,
    0
  );
  return HERO_HEADLINE_BASE_DELAY + totalWords * WORD_REVEAL_STAGGER + 0.08;
}

export function HomeHeroSection() {
  const introReady = useHeroIntroReady();
  const subcopyDelay = resolveSubcopyDelay();
  const ctaDelay = subcopyDelay + 0.32;

  return (
    <section className="hero-cinematic hero-home-aurora hero-home-viewport relative flex flex-col">
      <HeroLivingBackground />

      <div aria-hidden className="hero-text-scrim pointer-events-none absolute inset-0 z-[1]" />

      <div className="container-page relative z-10 flex flex-1 flex-col justify-center px-5 pb-24 pt-[calc(var(--site-header-offset)+1.25rem)] sm:px-8 sm:py-20 sm:pb-10 lg:py-24 lg:pb-12">
        <div className="hero-home-copy mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <HeroRotatingTitle className="mx-auto w-full max-w-5xl" />
          {introReady ? (
            <WordReveal
              as="p"
              text={HERO_SUBCOPY}
              className="section-copy mx-auto mt-[var(--hero-sub-gap)] max-w-xl sm:text-base"
              delay={subcopyDelay}
              stagger={WORD_REVEAL_STAGGER}
              duration={WORD_REVEAL_DURATION}
              intensity="body"
              trigger="immediate"
            />
          ) : (
            <p
              className="section-copy mx-auto mt-[var(--hero-sub-gap)] max-w-xl opacity-0 sm:text-base"
              aria-hidden
            >
              {HERO_SUBCOPY}
            </p>
          )}
          {introReady ? (
            <RevealText delay={ctaDelay}>
              <div className="mt-[var(--hero-cta-gap)] flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
                <motion.div className="w-full sm:w-auto" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    variant="inverse"
                    className="h-12 min-h-12 w-full rounded-md px-8 sm:w-auto"
                    render={<Link href="/waitlist" />}
                  >
                    <ArrowUpRight className="size-4" />
                    Gabung Waitlist
                  </Button>
                </motion.div>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 min-h-12 w-full rounded-md border-border/70 bg-card/40 px-7 text-sm text-foreground no-underline hover:text-foreground visited:text-foreground sm:h-11 sm:w-auto"
                  render={<Link href="/katalog" />}
                >
                  Jelajahi Katalog
                </Button>
              </div>
            </RevealText>
          ) : (
            <div className="mt-[var(--hero-cta-gap)] h-12 opacity-0" aria-hidden />
          )}
        </div>
      </div>

      <HeroNavSlot>
        <SiteNavbar layout="hero-anchor" />
      </HeroNavSlot>
    </section>
  );
}

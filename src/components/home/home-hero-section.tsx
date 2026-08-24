"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { useSyncExternalStore } from "react";

import { HeroLivingBackground } from "@/components/hero-living-bg";
import { HeroNavSlot } from "@/components/hero-nav-slot";
import {
  resolveHeroSubcopyDelay,
  resolveHeroSubcopyDelaySSR,
} from "@/components/motion/hero-intro-timing";
import { HeroRotatingTitle } from "@/components/motion/hero-rotating-title";
import { RevealText } from "@/components/motion/reveal";
import {
  WORD_REVEAL_DURATION,
  WORD_REVEAL_STAGGER,
  WordReveal,
} from "@/components/motion/word-reveal";
import { SiteNavbar } from "@/components/site-navbar";
import { Button } from "@/components/ui/button";
import { useLandingLock } from "@/components/home/use-landing-lock";

const HERO_HEADLINE_LINES = ["Pelajari trading", "nyaman & terstruktur"] as const;
const HERO_SUBCOPY =
  "Pilih kelas yang cocok. Materi runut terkurasi lewat proses review mentor.";

const HERO_HEADLINE_LINE_LIST = [...HERO_HEADLINE_LINES];

function subscribeToHeroSubcopyDelay() {
  return () => {};
}

function getHeroSubcopyDelay() {
  return resolveHeroSubcopyDelay(HERO_HEADLINE_LINE_LIST);
}

function getHeroSubcopyDelaySSR() {
  return resolveHeroSubcopyDelaySSR(HERO_HEADLINE_LINE_LIST);
}

export function HomeHeroSection() {
  const subcopyDelay = useSyncExternalStore(
    subscribeToHeroSubcopyDelay,
    getHeroSubcopyDelay,
    getHeroSubcopyDelaySSR
  );
  const lockNav = useLandingLock();

  return (
    <section className="hero-cinematic hero-home-aurora hero-home-viewport relative flex min-h-[100dvh] flex-col">
      <HeroLivingBackground />

      <div aria-hidden className="hero-text-scrim pointer-events-none absolute inset-0 z-[1]" />

      <div className="container-page relative z-10 flex flex-1 flex-col justify-center px-5 pb-24 pt-[calc(var(--site-header-offset)+1.25rem)] sm:px-8 sm:py-20 sm:pb-10 lg:py-24 lg:pb-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <HeroRotatingTitle staticLine={HERO_HEADLINE_LINES[1]} className="mx-auto max-w-4xl" />
          <WordReveal
            as="p"
            text={HERO_SUBCOPY}
            className="section-copy mx-auto mt-5 max-w-xl sm:text-base"
            delay={subcopyDelay}
            stagger={WORD_REVEAL_STAGGER}
            duration={WORD_REVEAL_DURATION}
            intensity="body"
            trigger="immediate"
          />
          <RevealText delay={subcopyDelay + 0.28}>
            <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
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
        </div>
      </div>

      {lockNav ? null : (
        <HeroNavSlot>
          <SiteNavbar layout="hero-anchor" />
        </HeroNavSlot>
      )}
    </section>
  );
}

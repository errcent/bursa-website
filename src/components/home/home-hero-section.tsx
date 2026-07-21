"use client";

import Link from "next/link";
import { ArrowLeftRight, ArrowUpRight, Bitcoin, LineChart } from "lucide-react";
import { motion } from "motion/react";
import { useSyncExternalStore } from "react";

import { HeroLivingBackground } from "@/components/hero-living-bg";
import { HeroNavSlot } from "@/components/hero-nav-slot";
import {
  resolveHeroSubcopyDelay,
  resolveHeroSubcopyDelaySSR,
} from "@/components/motion/hero-intro-timing";
import { HeroRotatingTitle } from "@/components/motion/hero-rotating-title";
import { HeroTyping } from "@/components/motion/hero-typing";
import { Reveal, RevealText } from "@/components/motion/reveal";
import {
  WORD_REVEAL_DURATION,
  WORD_REVEAL_STAGGER,
  WordReveal,
} from "@/components/motion/word-reveal";
import { SiteNavbar } from "@/components/site-navbar";
import { Button } from "@/components/ui/button";

const HERO_HEADLINE_LINES = ["Pelajari trading", "nyaman & terstruktur"] as const;
const HERO_SUBCOPY =
  "Pilih kelas yang cocok. Materi runut terkurasi dari mentor terverifikasi.";

const instruments = [
  { name: "Saham", href: "/katalog", icon: LineChart },
  { name: "Crypto", href: "/katalog", icon: Bitcoin },
  { name: "Forex", href: "/katalog", icon: ArrowLeftRight },
] as const;

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

function scrollToPopularClasses() {
  const el = document.getElementById("kelas-unggulan");
  if (!el) return;
  const navOffset = 96;
  const top = el.getBoundingClientRect().top + window.scrollY - navOffset;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export function HomeHeroSection() {
  const heroBadgeText = "Solusi Edukasi Trading";
  const subcopyDelay = useSyncExternalStore(
    subscribeToHeroSubcopyDelay,
    getHeroSubcopyDelay,
    getHeroSubcopyDelaySSR
  );

  return (
    <section className="hero-cinematic hero-home-viewport relative flex min-h-[100dvh] flex-col">
      <HeroLivingBackground />

      <div aria-hidden className="hero-text-scrim pointer-events-none absolute inset-0 z-[1]" />

      <div className="container-page relative z-10 flex flex-1 flex-col justify-center px-5 py-14 pb-8 sm:px-8 sm:py-20 sm:pb-10 lg:py-24 lg:pb-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="badge-pill mb-6 inline-flex items-center gap-2">
            <HeroTyping text={heroBadgeText} />
          </span>
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
                  className="h-12 w-full rounded-full px-8 sm:w-auto"
                  render={<Link href="/waitlist" />}
                >
                  <ArrowUpRight className="size-4" />
                  Gabung Waitlist
                </Button>
              </motion.div>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-full border-border/70 bg-card/40 px-7 text-sm sm:h-11 sm:w-auto"
                onClick={scrollToPopularClasses}
              >
                Pelajari Lebih Lanjut
              </Button>
            </div>
          </RevealText>

          <Reveal delay={subcopyDelay + 0.55} className="mt-10 w-full sm:mt-14">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {instruments.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="logo-strip-item inline-flex items-center gap-2"
                  >
                    <Icon className="size-4" strokeWidth={1.5} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </Reveal>
        </div>
      </div>

      <HeroNavSlot>
        <SiteNavbar layout="hero-anchor" />
      </HeroNavSlot>
    </section>
  );
}

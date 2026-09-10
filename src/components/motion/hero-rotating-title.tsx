"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

import { HERO_HEADLINE_BASE_DELAY } from "@/components/motion/hero-intro-timing";
import { useHeroIntroReady } from "@/components/motion/use-hero-intro-ready";
import {
  WORD_REVEAL_DURATION,
  WORD_REVEAL_STAGGER,
  wordRevealTotalDuration,
  WordReveal,
} from "@/components/motion/word-reveal";
import { useMobileLayout } from "@/hooks/use-mobile-layout";
import { cn } from "@/lib/utils";

/**
 * Two-line hero headline. Lines take turns cross-fading (4-beat cycle):
 * line 1, then line 2, hold, line 1 back, then line 2 back.
 *
 * Initial load: both lines reveal word-by-word. Rotation uses overlapping
 * crossfade (no mode="wait") so phrases blend instead of cutting.
 */

export const MOBILE_LINE1_PHRASES = [
  "Belajar trading & investasi",
  "Mendalami pasar keuangan",
] as const;

export const DESKTOP_LINE1_PHRASES = [
  "Mulai belajar trading & investasi",
  "Mendalami pasar keuangan",
] as const;

export const MOBILE_LINE2_PHRASES = [
  "dengan nyaman & terstruktur",
  "dengan sistem yang jelas",
] as const;

export const DESKTOP_LINE2_PHRASES = [
  "dengan nyaman dan terstruktur",
  "dengan sistem yang jelas",
] as const;

/** @deprecated Use mobile/desktop sets; kept for delay helpers. */
export const LINE2_PHRASES = DESKTOP_LINE2_PHRASES;

/** @deprecated Use mobile/desktop sets; kept for delay helpers. */
export const LINE1_PHRASES = DESKTOP_LINE1_PHRASES;

export const HERO_HEADLINE_REVEAL_LINES = [
  MOBILE_LINE1_PHRASES[0],
  MOBILE_LINE2_PHRASES[0],
] as const;

function longestPhrase(phrases: readonly string[]) {
  return phrases.reduce((longest, phrase) =>
    phrase.length > longest.length ? phrase : longest
  );
}

/** step → [line1 index, line2 index] */
const CYCLE = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
] as const;

const POST_REVEAL_HOLD_MS = 2800;
const LINE_GAP_MS = 200;
const PAIR_HOLD_MS = 2800;
const CROSSFADE = {
  duration: 0.95,
  ease: [0.22, 1, 0.36, 1] as const,
};
const CROSSFADE_MS = Math.round(CROSSFADE.duration * 1000);

function phrasesForStep(
  step: number,
  line1Phrases: readonly [string, string],
  line2Phrases: readonly [string, string]
) {
  const [i1, i2] = CYCLE[step % CYCLE.length];
  return { line1: line1Phrases[i1], line2: line2Phrases[i2] };
}

function resolveLine2Delay(headlineDelay: number, line1Reveal: string): number {
  const line1WordCount = line1Reveal.split(/\s+/).filter(Boolean).length;
  return headlineDelay + line1WordCount * WORD_REVEAL_STAGGER;
}

function resolveInitialRevealEndMs(
  headlineDelay: number,
  line1Reveal: string,
  line2Reveal: string
): number {
  const line2Delay = resolveLine2Delay(headlineDelay, line1Reveal);
  const endSec = wordRevealTotalDuration(line2Reveal, {
    delay: line2Delay,
    stagger: WORD_REVEAL_STAGGER,
    duration: WORD_REVEAL_DURATION,
  });
  return endSec * 1000 + POST_REVEAL_HOLD_MS;
}

function HeadlineLine({ sizer, children }: { sizer: string; children: ReactNode }) {
  return (
    <span className="hero-line relative block">
      <span className="invisible block whitespace-nowrap" aria-hidden>
        {sizer}
      </span>
      <span className="absolute inset-x-0 top-0 block whitespace-nowrap">{children}</span>
    </span>
  );
}

function PhraseCrossfade({ phrase }: { phrase: string }) {
  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.span
        key={phrase}
        className="text-gradient absolute inset-x-0 top-0 block text-center"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={CROSSFADE}
      >
        {phrase}
      </motion.span>
    </AnimatePresence>
  );
}

export function HeroRotatingTitle({ className }: { className?: string }) {
  const introReady = useHeroIntroReady();
  const isMobile = useMobileLayout();
  const [step, setStep] = useState(0);
  const [crossfadeReady, setCrossfadeReady] = useState(false);
  const headlineDelay = HERO_HEADLINE_BASE_DELAY;

  const line1Phrases = isMobile ? MOBILE_LINE1_PHRASES : DESKTOP_LINE1_PHRASES;
  const line2Phrases = isMobile ? MOBILE_LINE2_PHRASES : DESKTOP_LINE2_PHRASES;
  const line1Sizer = useMemo(() => longestPhrase(line1Phrases), [line1Phrases]);
  const line2Sizer = useMemo(() => longestPhrase(line2Phrases), [line2Phrases]);
  const line1Reveal = line1Phrases[0];
  const line2Reveal = line2Phrases[0];

  useEffect(() => {
    if (!introReady) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const reduceTimer = window.setTimeout(() => setCrossfadeReady(true), 0);
      return () => window.clearTimeout(reduceTimer);
    }

    const revealEndMs = resolveInitialRevealEndMs(
      headlineDelay,
      line1Reveal,
      line2Reveal
    );
    const revealTimer = window.setTimeout(() => {
      setCrossfadeReady(true);
    }, revealEndMs);

    return () => window.clearTimeout(revealTimer);
  }, [introReady, headlineDelay, line1Reveal, line2Reveal]);

  useEffect(() => {
    setStep(0);
  }, [isMobile]);

  useEffect(() => {
    if (!crossfadeReady) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let timer = 0;
    let current = 0;

    const delayAfter = (justLandedOn: number, isFirst: boolean) => {
      if (isFirst) return 0;
      const line1JustChanged = justLandedOn === 1 || justLandedOn === 3;
      return line1JustChanged ? CROSSFADE_MS + LINE_GAP_MS : CROSSFADE_MS + PAIR_HOLD_MS;
    };

    const tick = (isFirst: boolean) => {
      const wait = delayAfter(current, isFirst);
      timer = window.setTimeout(() => {
        if (cancelled) return;
        current = (current + 1) % CYCLE.length;
        setStep(current);
        tick(false);
      }, wait);
    };

    tick(true);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [crossfadeReady]);

  const line2Delay = resolveLine2Delay(headlineDelay, line1Reveal);
  const showWordReveal = introReady && !crossfadeReady;
  const { line1, line2 } = phrasesForStep(step, line1Phrases, line2Phrases);

  return (
    <h1
      className={cn("page-hero-title hero-home-title", className)}
      aria-label={`${line1} ${line2}`}
    >
      <HeadlineLine sizer={line1Sizer}>
        {!introReady ? (
          <span className="text-gradient block">
            {line1Reveal}
          </span>
        ) : showWordReveal ? (
          <WordReveal
            as="span"
            text={line1Reveal}
            className="block"
            wordClassName="text-gradient"
            delay={headlineDelay}
            stagger={WORD_REVEAL_STAGGER}
            duration={WORD_REVEAL_DURATION}
            intensity="headline"
            trigger="immediate"
          />
        ) : (
          <PhraseCrossfade phrase={line1} />
        )}
      </HeadlineLine>{" "}
      <HeadlineLine sizer={line2Sizer}>
        {!introReady ? (
          <span className="text-gradient block">
            {line2Reveal}
          </span>
        ) : showWordReveal ? (
          <WordReveal
            as="span"
            text={line2Reveal}
            className="block"
            wordClassName="text-gradient"
            delay={line2Delay}
            stagger={WORD_REVEAL_STAGGER}
            duration={WORD_REVEAL_DURATION}
            intensity="headline"
            trigger="immediate"
          />
        ) : (
          <PhraseCrossfade phrase={line2} />
        )}
      </HeadlineLine>
    </h1>
  );
}

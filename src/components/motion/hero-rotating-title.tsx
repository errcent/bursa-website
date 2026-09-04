"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

import { HERO_HEADLINE_BASE_DELAY } from "@/components/motion/hero-intro-timing";
import { useHeroIntroReady } from "@/components/motion/use-hero-intro-ready";
import {
  WORD_REVEAL_DURATION,
  WORD_REVEAL_STAGGER,
  wordRevealTotalDuration,
  WordReveal,
} from "@/components/motion/word-reveal";
import { cn } from "@/lib/utils";

/**
 * Two-line hero headline. Lines take turns cross-fading (4-beat cycle):
 * line 1, then line 2, hold, line 1 back, then line 2 back.
 *
 * Initial load: both lines reveal word-by-word. Rotation uses overlapping
 * crossfade (no mode="wait") so phrases blend instead of cutting.
 */

export const LINE1_PHRASES = [
  "Mulai belajar trading & investasi",
  "Mendalami trading & investasi",
] as const;

export const LINE2_PHRASES = [
  "dengan nyaman & terstruktur",
  "dengan sistem yang jelas",
] as const;

export const HERO_HEADLINE_REVEAL_LINES = [LINE1_PHRASES[0], LINE2_PHRASES[0]] as const;

const LINE1_SIZER = LINE1_PHRASES[0];
const LINE2_SIZER = LINE2_PHRASES[0];

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
  duration: 1.4,
  ease: [0.22, 1, 0.36, 1] as const,
};
const CROSSFADE_MS = Math.round(CROSSFADE.duration * 1000);

function phrasesForStep(step: number) {
  const [i1, i2] = CYCLE[step % CYCLE.length];
  return { line1: LINE1_PHRASES[i1], line2: LINE2_PHRASES[i2] };
}

function resolveLine2Delay(headlineDelay: number): number {
  const line1WordCount = LINE1_PHRASES[0].split(/\s+/).filter(Boolean).length;
  return headlineDelay + line1WordCount * WORD_REVEAL_STAGGER;
}

function resolveInitialRevealEndMs(headlineDelay: number): number {
  const line2Delay = resolveLine2Delay(headlineDelay);
  const endSec = wordRevealTotalDuration(LINE2_PHRASES[0], {
    delay: line2Delay,
    stagger: WORD_REVEAL_STAGGER,
    duration: WORD_REVEAL_DURATION,
  });
  return endSec * 1000 + POST_REVEAL_HOLD_MS;
}

function HeadlineLine({ sizer, children }: { sizer: string; children: ReactNode }) {
  return (
    <span className="relative block">
      <span className="invisible block" aria-hidden>
        {sizer}
      </span>
      <span className="absolute inset-x-0 top-0 block">{children}</span>
    </span>
  );
}

function PhraseCrossfade({ phrase }: { phrase: string }) {
  return (
    <AnimatePresence initial={false}>
      <motion.span
        key={phrase}
        className="text-gradient absolute inset-x-0 top-0 block text-center"
        initial={{ opacity: 0, filter: "blur(12px)", y: 8 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        exit={{ opacity: 0, filter: "blur(12px)", y: -8 }}
        transition={CROSSFADE}
      >
        {phrase}
      </motion.span>
    </AnimatePresence>
  );
}

export function HeroRotatingTitle({ className }: { className?: string }) {
  const introReady = useHeroIntroReady();
  const [step, setStep] = useState(0);
  const [crossfadeReady, setCrossfadeReady] = useState(false);
  const headlineDelay = HERO_HEADLINE_BASE_DELAY;

  useEffect(() => {
    if (!introReady) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const reduceTimer = window.setTimeout(() => setCrossfadeReady(true), 0);
      return () => window.clearTimeout(reduceTimer);
    }

    const revealEndMs = resolveInitialRevealEndMs(headlineDelay);
    const revealTimer = window.setTimeout(() => {
      setCrossfadeReady(true);
    }, revealEndMs);

    return () => window.clearTimeout(revealTimer);
  }, [introReady, headlineDelay]);

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

  const line2Delay = resolveLine2Delay(headlineDelay);
  const showWordReveal = introReady && !crossfadeReady;
  const { line1, line2 } = phrasesForStep(step);

  return (
    <h1
      className={cn("page-hero-title hero-home-title", className)}
      aria-label={`${line1} ${line2}`}
    >
      <HeadlineLine sizer={LINE1_SIZER}>
        {!introReady ? (
          <span className="text-gradient block opacity-0" aria-hidden>
            {LINE1_PHRASES[0]}
          </span>
        ) : showWordReveal ? (
          <WordReveal
            as="span"
            text={LINE1_PHRASES[0]}
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
      <HeadlineLine sizer={LINE2_SIZER}>
        {!introReady ? (
          <span className="text-gradient block opacity-0" aria-hidden>
            {LINE2_PHRASES[0]}
          </span>
        ) : showWordReveal ? (
          <WordReveal
            as="span"
            text={LINE2_PHRASES[0]}
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

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { HERO_HEADLINE_BASE_DELAY } from "@/components/motion/hero-intro-timing";
import { useHeroIntroReady } from "@/components/motion/use-hero-intro-ready";
import {
  tokenizeForReveal,
  WORD_REVEAL_DURATION,
  WORD_REVEAL_STAGGER,
  wordRevealTotalDuration,
  WordReveal,
} from "@/components/motion/word-reveal";
import { cn } from "@/lib/utils";

/**
 * Hero headline where the first line slowly cross-fades (with a soft blur)
 * between phrases while the second line stays fixed.
 *
 * Initial load: both lines reveal word-by-word. Rotation uses overlapping
 * crossfade (no mode="wait") so phrases blend instead of cutting.
 */

const PHRASES = ["Pelajari trading", "Mendalami trading", "Nikmati pembelajaran"];

const ROTATE_INTERVAL_MS = 4600;
const POST_REVEAL_HOLD_MS = 2800;
const CROSSFADE = {
  duration: 1.45,
  ease: [0.22, 1, 0.36, 1] as const,
};

function resolveLine2Delay(headlineDelay: number): number {
  const line1WordCount = tokenizeForReveal(PHRASES[0]).length;
  return headlineDelay + line1WordCount * WORD_REVEAL_STAGGER;
}

function resolveInitialRevealEndMs(headlineDelay: number, staticLine: string): number {
  const line2Delay = resolveLine2Delay(headlineDelay);
  const endSec = wordRevealTotalDuration(staticLine, {
    delay: line2Delay,
    stagger: WORD_REVEAL_STAGGER,
    duration: WORD_REVEAL_DURATION,
  });
  return endSec * 1000 + POST_REVEAL_HOLD_MS;
}

function PhraseCrossfade({ index }: { index: number }) {
  return (
    <span className="relative block min-h-[1.15em]">
      <span className="invisible block" aria-hidden>
        {PHRASES[index]}
      </span>
      <AnimatePresence initial={false}>
        <motion.span
          key={index}
          className="text-gradient absolute inset-x-0 top-0 block text-center"
          initial={{ opacity: 0, filter: "blur(16px)", y: 12 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          exit={{ opacity: 0, filter: "blur(16px)", y: -10 }}
          transition={CROSSFADE}
        >
          {PHRASES[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function HeroRotatingTitle({
  staticLine = "nyaman & terstruktur",
  className,
}: {
  staticLine?: string;
  className?: string;
}) {
  const introReady = useHeroIntroReady();
  const [index, setIndex] = useState(0);
  const [crossfadeReady, setCrossfadeReady] = useState(false);
  const headlineDelay = HERO_HEADLINE_BASE_DELAY;

  useEffect(() => {
    if (!introReady) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCrossfadeReady(true);
      return;
    }

    const revealEndMs = resolveInitialRevealEndMs(headlineDelay, staticLine);
    const revealTimer = window.setTimeout(() => {
      // Hand off at phrase 0 first so the next tick can crossfade 0 → 1.
      setCrossfadeReady(true);
    }, revealEndMs);

    return () => window.clearTimeout(revealTimer);
  }, [introReady, headlineDelay, staticLine]);

  useEffect(() => {
    if (!crossfadeReady) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % PHRASES.length);
    }, ROTATE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [crossfadeReady]);

  const line2Delay = resolveLine2Delay(headlineDelay);
  const showWordReveal = introReady && !crossfadeReady;

  return (
    <h1 className={cn("page-hero-title", className)} aria-label={`${PHRASES[index]} ${staticLine}`}>
      <span className="block min-h-[1.15em]">
        {!introReady ? (
          <span className="text-gradient block opacity-0" aria-hidden>
            {PHRASES[0]}
          </span>
        ) : showWordReveal ? (
          <WordReveal
            as="span"
            text={PHRASES[0]}
            className="block"
            wordClassName="text-gradient"
            delay={headlineDelay}
            stagger={WORD_REVEAL_STAGGER}
            duration={WORD_REVEAL_DURATION}
            intensity="headline"
            trigger="immediate"
          />
        ) : (
          <PhraseCrossfade index={index} />
        )}
      </span>{" "}
      {!introReady ? (
        <span className="text-gradient block opacity-0" aria-hidden>
          {staticLine}
        </span>
      ) : showWordReveal ? (
        <WordReveal
          as="span"
          text={staticLine}
          className="block"
          wordClassName="text-gradient"
          delay={line2Delay}
          stagger={WORD_REVEAL_STAGGER}
          duration={WORD_REVEAL_DURATION}
          intensity="headline"
          trigger="immediate"
        />
      ) : (
        <span className="text-gradient block">{staticLine}</span>
      )}
    </h1>
  );
}

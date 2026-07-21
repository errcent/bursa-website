"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import {
  resolveHeroIntroDelay,
  resolveHeroIntroDelaySSR,
} from "@/components/motion/hero-intro-timing";
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
 * between phrases while the second line stays fixed. Reads as one sentence:
 * e.g. "Pelajari trading" + "nyaman & terstruktur".
 *
 * The two lines are always stacked (top/bottom), never inline.
 * Initial load: both lines reveal word-by-word (continuous stagger across lines).
 */

const PHRASES = ["Pelajari trading", "Mendalami trading", "Nikmati pembelajaran"];

const ROTATE_INTERVAL_MS = 4200;
const POST_REVEAL_HOLD_MS = 2400;

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

export function HeroRotatingTitle({
  staticLine = "nyaman & terstruktur",
  className,
}: {
  staticLine?: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [initialRevealDone, setInitialRevealDone] = useState(false);
  const [rotationStarted, setRotationStarted] = useState(false);
  const [headlineDelay, setHeadlineDelay] = useState(resolveHeroIntroDelaySSR);

  useEffect(() => {
    setHeadlineDelay(resolveHeroIntroDelay());
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInitialRevealDone(true);
      return;
    }

    const revealEndMs = resolveInitialRevealEndMs(headlineDelay, staticLine);
    const revealTimer = window.setTimeout(() => {
      setInitialRevealDone(true);
    }, revealEndMs);

    return () => window.clearTimeout(revealTimer);
  }, [headlineDelay, staticLine]);

  useEffect(() => {
    if (!initialRevealDone) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(
      () =>
        setIndex((prev) => {
          setRotationStarted(true);
          return (prev + 1) % PHRASES.length;
        }),
      ROTATE_INTERVAL_MS
    );
    return () => window.clearInterval(id);
  }, [initialRevealDone]);

  const line2Delay = resolveLine2Delay(headlineDelay);
  const showInitialWordReveal = !initialRevealDone && index === 0;

  return (
    <h1 className={cn("page-hero-title", className)} aria-label={`${PHRASES[index]} ${staticLine}`}>
      <span className="block min-h-[1.15em]">
        {showInitialWordReveal ? (
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
        ) : initialRevealDone && rotationStarted ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={index}
              className="text-gradient block"
              initial={{ opacity: 0, filter: "blur(14px)", y: 12 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(14px)", y: -12 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {PHRASES[index]}
            </motion.span>
          </AnimatePresence>
        ) : initialRevealDone ? (
          <span className="text-gradient block">{PHRASES[0]}</span>
        ) : (
          <span className="text-gradient block opacity-0" aria-hidden>
            {PHRASES[0]}
          </span>
        )}
      </span>

      {showInitialWordReveal ? (
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
      ) : initialRevealDone ? (
        <span className="text-gradient block">{staticLine}</span>
      ) : (
        <span className="text-gradient block opacity-0" aria-hidden>
          {staticLine}
        </span>
      )}
    </h1>
  );
}

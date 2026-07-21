"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { cn } from "@/lib/utils";

import {
  WORD_REVEAL_DURATION,
  WORD_REVEAL_EASE,
  WORD_REVEAL_STAGGER,
  WordReveal,
} from "@/components/motion/word-reveal";

const REVEAL_EASE = WORD_REVEAL_EASE;
const RADIAL_EXIT_EASE = [0.19, 1, 0.22, 1] as const;
const LETTER_STAGGER = 0.05;
const REVEAL_UNIT_DURATION = WORD_REVEAL_DURATION;
const TITLE_TAGLINE_GAP = 0.18;

/** Timeline (seconds) — total ~3.77s after slower text reveal */
const T_BLANK = 0.45;
const T = {
  blank: T_BLANK,
  barDelay: 0.52,
  barFill: 1.45,
  holdEnd: 2.55,
  exitLead: 0.12,
  exitRadial: 1.1,
} as const;

const TITLE_TEXT = "Bursa";
const TITLE_REVEAL_END =
  T.blank + (TITLE_TEXT.length - 1) * LETTER_STAGGER + REVEAL_UNIT_DURATION;
const TAGLINE_DELAY = TITLE_REVEAL_END + TITLE_TAGLINE_GAP;

const LOGO_FADE_LEAD = 0.1;
const TOTAL_DURATION = T.holdEnd + T.exitLead + T.exitRadial;
const RADIAL_START = T.holdEnd + T.exitLead;
const LOGO_FADE_START = RADIAL_START - LOGO_FADE_LEAD;

type IntroPreloaderProps = {
  onComplete: () => void;
};

const letterContainerVariants: Variants = {
  hidden: {},
  show: (delay: number) => ({
    transition: {
      staggerChildren: LETTER_STAGGER,
      delayChildren: delay,
    },
  }),
};

const titleLetterVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
    scale: 0.88,
    filter: "blur(8px)",
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: REVEAL_UNIT_DURATION, ease: REVEAL_EASE },
  },
};

function IntroLetterReveal({
  text,
  className,
  delay = 0,
  "aria-label": ariaLabel,
}: {
  text: string;
  className?: string;
  delay?: number;
  "aria-label"?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const letters = [...text];

  if (prefersReducedMotion) {
    return (
      <span className={className} aria-label={ariaLabel}>
        {text}
      </span>
    );
  }

  return (
    <motion.span
      className={className}
      aria-label={ariaLabel}
      initial="hidden"
      animate="show"
      custom={delay}
      variants={letterContainerVariants}
    >
      {letters.map((letter, index) => (
        <motion.span
          key={`${letter}-${index}`}
          className="inline-block"
          variants={titleLetterVariants}
          aria-hidden
        >
          {letter}
        </motion.span>
      ))}
    </motion.span>
  );
}

function AmbientDrift() {
  return (
    <>
      <motion.div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.85, 0.65],
          background: [
            "radial-gradient(ellipse 55% 42% at 48% 52%, rgba(123,126,184,0.06), transparent 68%)",
            "radial-gradient(ellipse 62% 48% at 52% 48%, rgba(123,126,184,0.1), transparent 72%)",
            "radial-gradient(ellipse 58% 44% at 50% 50%, rgba(123,126,184,0.08), transparent 70%)",
          ],
        }}
        transition={{ duration: 2.4, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        animate={{
          background: [
            "radial-gradient(circle at 20% 80%, rgba(245,245,245,0.03), transparent 42%)",
            "radial-gradient(circle at 78% 22%, rgba(245,245,245,0.04), transparent 46%)",
            "radial-gradient(circle at 20% 80%, rgba(245,245,245,0.03), transparent 42%)",
          ],
        }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

function ProgressBar() {
  return (
    <div
      className="relative mt-8 h-[2px] w-[220px] overflow-visible sm:w-[300px] md:w-[340px]"
      aria-hidden
    >
      <div className="absolute inset-0 rounded-full bg-white/[0.08]" />
      <motion.div
        className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-gradient-to-r from-white/50 via-[#F5F5F5] to-white/90"
        initial={{ scaleX: 0, opacity: 0.35 }}
        animate={{
          scaleX: 1,
          opacity: 1,
          boxShadow: [
            "0 0 0px rgba(123,126,184,0), 0 0 0px rgba(245,245,245,0)",
            "0 0 16px rgba(123,126,184,0.6), 0 0 8px rgba(245,245,245,0.8)",
            "0 0 10px rgba(123,126,184,0.45), 0 0 4px rgba(245,245,245,0.55)",
          ],
        }}
        transition={{
          delay: T.barDelay,
          duration: T.barFill,
          ease: REVEAL_EASE,
          boxShadow: { duration: T.barFill, ease: REVEAL_EASE },
        }}
      />
      <motion.div
        className="absolute inset-y-[-3px] left-0 w-full origin-left rounded-full bg-[#7b7eb8]/30 blur-[6px]"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: [0, 0.65, 0.85] }}
        transition={{
          delay: T.barDelay,
          duration: T.barFill,
          ease: REVEAL_EASE,
          opacity: { duration: T.barFill, ease: REVEAL_EASE },
        }}
      />
      <motion.div
        className="intro-bar-shimmer absolute inset-y-[-1px] left-0 w-[40%] rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent blur-[1px]"
        initial={{ x: "-120%", opacity: 0 }}
        animate={{
          x: ["-120%", "320%"],
          opacity: [0, 1, 0.85, 0],
        }}
        transition={{
          delay: T.barDelay + 0.08,
          duration: T.barFill + 0.18,
          ease: REVEAL_EASE,
        }}
      />
    </div>
  );
}

export function IntroPreloader({ onComplete }: IntroPreloaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const duration = prefersReducedMotion ? 0.55 : TOTAL_DURATION;
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(onComplete, duration * 1000);
    return () => window.clearTimeout(id);
  }, [onComplete, duration]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = window.setTimeout(() => setIsExiting(true), RADIAL_START * 1000);
    return () => window.clearTimeout(id);
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <motion.div
        className="intro-overlay fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#0a0a0a]"
        role="status"
        aria-live="polite"
        aria-label="Memuat Bursa"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 0.35, duration: 0.2, ease: "easeOut" }}
      >
        <h1 className="font-heading text-[2rem] font-bold tracking-[0.06em] text-[#F5F5F5] sm:text-5xl">
          Bursa
        </h1>
      </motion.div>
    );
  }

  const tLogoFade = LOGO_FADE_START / TOTAL_DURATION;
  const tRadial = RADIAL_START / TOTAL_DURATION;
  const tBloomPeak = (LOGO_FADE_START + LOGO_FADE_LEAD * 0.45) / TOTAL_DURATION;

  return (
    <motion.div
      className={cn(
        "intro-overlay fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a]",
        isExiting && "intro-overlay-radial-exit"
      )}
      role="status"
      aria-live="polite"
      aria-label="Memuat Bursa"
      style={
        isExiting
          ? {
              animationDuration: `${T.exitRadial}s`,
              willChange: "opacity, transform, --intro-mask-r",
            }
          : { willChange: "opacity, transform" }
      }
    >
      <AmbientDrift />

      <motion.div
        className="pointer-events-none absolute inset-0 bg-[#0a0a0a]"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.28, 0.08, 0] }}
        transition={{
          duration: TOTAL_DURATION,
          times: [0, tLogoFade, tBloomPeak, tRadial, 1],
          ease: [REVEAL_EASE, REVEAL_EASE, RADIAL_EXIT_EASE],
        }}
      />

      <motion.div
        className="relative flex flex-col items-center"
        initial={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        animate={{
          opacity: [1, 1, 0.94, 0.72, 0],
          scale: [1, 1, 1.03, 1.02, 0.97],
          filter: ["blur(0px)", "blur(0px)", "blur(1px)", "blur(4px)", "blur(14px)"],
        }}
        transition={{
          duration: TOTAL_DURATION,
          times: [0, tLogoFade, tBloomPeak, tRadial, 1],
          ease: [REVEAL_EASE, REVEAL_EASE, RADIAL_EXIT_EASE, RADIAL_EXIT_EASE],
        }}
        style={{ willChange: "transform, opacity, filter" }}
      >
        <motion.h1
          className="font-heading text-[2rem] font-bold tracking-[0.06em] text-[#F5F5F5] sm:text-5xl sm:tracking-[0.08em]"
          animate={{
            textShadow: [
              "0 0 0px rgba(123,126,184,0)",
              "0 0 24px rgba(123,126,184,0.35)",
              "0 0 18px rgba(123,126,184,0.28)",
              "0 0 32px rgba(123,126,184,0.45)",
            ],
          }}
          transition={{
            duration: TOTAL_DURATION * 0.85,
            times: [0, 0.35, 0.62, 1],
            ease: "easeInOut",
          }}
        >
          <IntroLetterReveal delay={T.blank} aria-label="Bursa" text={TITLE_TEXT} />
        </motion.h1>

        <ProgressBar />
      </motion.div>

      <motion.p
        className="pointer-events-none absolute inset-x-0 bottom-8 flex items-baseline justify-center gap-1.5 text-sm sm:bottom-10 sm:text-base"
        initial={{ opacity: 1 }}
        animate={{
          opacity: [1, 1, 0, 0],
        }}
        transition={{
          duration: TOTAL_DURATION,
          times: [0, tLogoFade, tRadial, 1],
          ease: [REVEAL_EASE, RADIAL_EXIT_EASE],
        }}
      >
        <WordReveal
          delay={TAGLINE_DELAY}
          stagger={WORD_REVEAL_STAGGER}
          duration={WORD_REVEAL_DURATION}
          aria-label="by bursanalar."
          segments={[
            {
              text: "by",
              className: "font-sans font-normal tracking-wide text-[#F5F5F5]/70",
            },
            {
              text: "bursanalar.",
              className: "font-brand text-base font-bold tracking-tight text-[#F5F5F5] sm:text-lg",
            },
          ]}
        />
      </motion.p>
    </motion.div>
  );
}

/** When underlying page content should begin its reveal (ms). */
export const INTRO_REVEAL_START_MS = RADIAL_START * 1000;
export const INTRO_REVEAL_DURATION_S = T.exitRadial;
export const INTRO_REVEAL_EASE = RADIAL_EXIT_EASE;

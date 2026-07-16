"use client";

import { useEffect } from "react";
import { motion } from "motion/react";

const LOGO_POP_EASE = [0.34, 1.56, 0.64, 1] as const;
const REVEAL_EASE = [0.22, 1, 0.36, 1] as const;

/** Timeline (seconds) */
const T = {
  blank: 0.5,
  logoIn: 0.2,
  barDelay: 0.75,
  barFill: 0.35,
  holdEnd: 1.9,
  fadeOut: 0.25,
  total: 2.2,
} as const;

type IntroPreloaderProps = {
  onComplete: () => void;
};

export function IntroPreloader({ onComplete }: IntroPreloaderProps) {
  useEffect(() => {
    const id = window.setTimeout(onComplete, (T.holdEnd + T.fadeOut) * 1000);
    return () => window.clearTimeout(id);
  }, [onComplete]);

  return (
    <motion.div
      className="intro-overlay fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#0a0a0a]"
      role="status"
      aria-live="polite"
      aria-label="Memuat Bursa"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: T.holdEnd, duration: T.fadeOut, ease: "easeIn" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_50%,rgba(123,126,184,0.08),transparent_70%)]" />

      <motion.div
        className="relative flex flex-col items-center"
        initial={{ opacity: 1, scale: 1, y: 0 }}
        animate={{ opacity: 0, scale: 1.05, y: -10 }}
        transition={{ delay: T.holdEnd, duration: T.fadeOut, ease: "easeIn" }}
      >
        <motion.h1
          className="font-heading text-[2rem] font-bold tracking-[0.06em] text-[#F5F5F5] sm:text-5xl sm:tracking-[0.08em]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: [0.9, 1.05, 1] }}
          transition={{
            opacity: { delay: T.blank, duration: T.logoIn, ease: "easeOut" },
            scale: {
              delay: T.blank,
              duration: 0.45,
              times: [0, 0.55, 1],
              ease: LOGO_POP_EASE,
            },
          }}
        >
          Bursa
        </motion.h1>

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
                "0 0 14px rgba(123,126,184,0.55), 0 0 6px rgba(245,245,245,0.75)",
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
            animate={{ scaleX: 1, opacity: [0, 0.6, 0.85] }}
            transition={{
              delay: T.barDelay,
              duration: T.barFill,
              ease: REVEAL_EASE,
              opacity: { duration: T.barFill, ease: REVEAL_EASE },
            }}
          />
        </div>
      </motion.div>

      <motion.p
        className="pointer-events-none absolute inset-x-0 bottom-8 flex items-baseline justify-center gap-1.5 text-sm sm:bottom-10 sm:text-base"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: T.blank + 0.35, duration: 0.35, ease: "easeOut" }}
      >
        <span className="font-sans font-normal tracking-wide text-[#F5F5F5]/70">by</span>
        <span className="font-brand text-base font-bold tracking-tight text-[#F5F5F5] sm:text-lg">
          bursanalar.
        </span>
      </motion.p>
    </motion.div>
  );
}

export const INTRO_REVEAL_START_MS = (T.holdEnd - 0.05) * 1000;

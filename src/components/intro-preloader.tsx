"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { brandSlot } from "@/lib/brand/assets";
import { cn } from "@/lib/utils";

const REVEAL_EASE = [0.22, 1, 0.36, 1] as const;
const RADIAL_EXIT_EASE = [0.19, 1, 0.22, 1] as const;

/** Timeline (seconds), total ~3.77s */
const T_BLANK = 0.45;
const T = {
  blank: T_BLANK,
  barDelay: 0.52,
  barFill: 1.45,
  holdEnd: 2.55,
  exitLead: 0.12,
  exitRadial: 1.1,
} as const;

const WM_DELAY = T.blank + 0.35;

const LOGO_FADE_LEAD = 0.1;
const TOTAL_DURATION = T.holdEnd + T.exitLead + T.exitRadial;
const RADIAL_START = T.holdEnd + T.exitLead;
const LOGO_FADE_START = RADIAL_START - LOGO_FADE_LEAD;

const productDesktop = brandSlot("productPreloaderDesktop");
const productMobile = brandSlot("productPreloaderMobile");
const wordmark = brandSlot("wordmarkPreloader");

type IntroPreloaderProps = {
  onComplete: () => void;
};

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

function PreloaderLogoAssets({ priority = false }: { priority?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Image
        src={productMobile.src}
        alt=""
        width={productMobile.w}
        height={productMobile.h}
        priority={priority}
        className="h-auto w-auto max-w-none sm:hidden"
        style={{ width: productMobile.w, height: productMobile.h }}
      />
      <Image
        src={productDesktop.src}
        alt=""
        width={productDesktop.w}
        height={productDesktop.h}
        priority={priority}
        className="hidden h-auto w-auto max-w-none sm:block"
        style={{ width: productDesktop.w, height: productDesktop.h }}
      />
      <Image
        src={wordmark.src}
        alt=""
        width={wordmark.w}
        height={wordmark.h}
        priority={priority}
        className="h-auto w-auto max-w-none opacity-90"
        style={{ width: wordmark.w, height: wordmark.h }}
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
        <PreloaderLogoAssets priority />
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
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: T.blank, duration: 0.55, ease: REVEAL_EASE }}
        >
          <Image
            src={productMobile.src}
            alt=""
            width={productMobile.w}
            height={productMobile.h}
            priority
            className="h-auto w-auto max-w-none sm:hidden"
            style={{ width: productMobile.w, height: productMobile.h }}
          />
          <Image
            src={productDesktop.src}
            alt=""
            width={productDesktop.w}
            height={productDesktop.h}
            priority
            className="hidden h-auto w-auto max-w-none sm:block"
            style={{ width: productDesktop.w, height: productDesktop.h }}
          />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: WM_DELAY, duration: 0.45, ease: REVEAL_EASE }}
          >
            <Image
              src={wordmark.src}
              alt=""
              width={wordmark.w}
              height={wordmark.h}
              priority
              className="h-auto w-auto max-w-none opacity-90"
              style={{ width: wordmark.w, height: wordmark.h }}
            />
          </motion.div>
        </motion.div>

        <ProgressBar />
      </motion.div>
    </motion.div>
  );
}

/** When underlying page content should begin its reveal (ms). */
export const INTRO_REVEAL_START_MS = RADIAL_START * 1000;
export const INTRO_REVEAL_DURATION_S = T.exitRadial;
export const INTRO_REVEAL_EASE = RADIAL_EXIT_EASE;

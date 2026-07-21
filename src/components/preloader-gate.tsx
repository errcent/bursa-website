"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import {
  IntroPreloader,
  INTRO_REVEAL_DURATION_S,
  INTRO_REVEAL_EASE,
  INTRO_REVEAL_START_MS,
} from "@/components/intro-preloader";

const SESSION_KEY = "bursa-intro-seen";
/** Hard cap so a stuck intro never leaves the page unresponsive. */
const INTRO_FAILSAFE_MS = 5500;

type Phase = "intro" | "revealing" | "done";

function clearIntroPending() {
  document.documentElement.classList.remove("intro-pending");
  document.body.style.overflow = "";
}

function readShouldPlayIntro(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) !== "1";
  } catch {
    return false;
  }
}

export function PreloaderGate({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  // SSR and first client paint must match: children only, no overlay.
  const [phase, setPhase] = useState<Phase>("done");
  const [showOverlay, setShowOverlay] = useState(false);

  useLayoutEffect(() => {
    if (prefersReducedMotion) {
      clearIntroPending();
      setPhase("done");
      setShowOverlay(false);
      return;
    }

    if (!readShouldPlayIntro()) {
      clearIntroPending();
      setPhase("done");
      setShowOverlay(false);
      return;
    }

    document.documentElement.classList.add("intro-pending");
    document.body.style.overflow = "hidden";
    setPhase("intro");
    setShowOverlay(true);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (phase === "revealing" || phase === "done") {
      clearIntroPending();
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "intro") return;

    const revealTimer = window.setTimeout(() => {
      setPhase("revealing");
    }, INTRO_REVEAL_START_MS);

    return () => window.clearTimeout(revealTimer);
  }, [phase]);

  const handleIntroComplete = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore quota / private mode */
    }
    clearIntroPending();
    setShowOverlay(false);
    setPhase("done");
  }, []);

  // Failsafe: never leave the UI locked behind a black intro screen.
  useEffect(() => {
    if (phase !== "intro" && phase !== "revealing") return;
    const id = window.setTimeout(handleIntroComplete, INTRO_FAILSAFE_MS);
    return () => window.clearTimeout(id);
  }, [phase, handleIntroComplete]);

  const contentHidden = phase === "intro";
  const contentAnimating = phase === "revealing";

  return (
    <>
      {showOverlay ? <IntroPreloader onComplete={handleIntroComplete} /> : null}

      <motion.div
        data-app-content
        className="flex min-h-0 flex-1 flex-col"
        initial={false}
        animate={
          contentHidden
            ? { opacity: 0, scale: 1.018, y: 8, filter: "blur(3px)" }
            : contentAnimating
              ? { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }
              : false
        }
        transition={
          contentAnimating
            ? { duration: INTRO_REVEAL_DURATION_S, ease: INTRO_REVEAL_EASE }
            : { duration: 0 }
        }
        style={
          contentHidden || contentAnimating
            ? {
                pointerEvents: contentHidden ? "none" : undefined,
                visibility: contentHidden ? "hidden" : "visible",
                willChange: "transform, opacity, filter",
                transform: "translateZ(0)",
              }
            : undefined
        }
      >
        {children}
      </motion.div>
    </>
  );
}

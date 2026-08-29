"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import {
  IntroPreloader,
  INTRO_REVEAL_DURATION_S,
  INTRO_REVEAL_EASE,
} from "@/components/intro-preloader";
import { notifyIntroExitStart } from "@/components/motion/hero-intro-timing";

const SESSION_KEY = "bursa-intro-seen";
/** Hard cap so a stuck intro never leaves the page unresponsive. */
const INTRO_FAILSAFE_MS = 12000;

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
      notifyIntroExitStart();
      setPhase("done");
      setShowOverlay(false);
      return;
    }

    if (!readShouldPlayIntro()) {
      clearIntroPending();
      notifyIntroExitStart();
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

  const handleExitStart = useCallback(() => {
    notifyIntroExitStart();
    setPhase("revealing");
  }, []);

  const handleIntroComplete = useCallback(() => {
    notifyIntroExitStart();
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
      {showOverlay ? (
        <IntroPreloader onExitStart={handleExitStart} onComplete={handleIntroComplete} />
      ) : null}

      <motion.div
        data-app-content
        className="flex min-h-0 flex-1 flex-col"
        initial={false}
        animate={{ opacity: contentHidden ? 0 : 1 }}
        transition={
          contentAnimating || contentHidden
            ? { duration: INTRO_REVEAL_DURATION_S, ease: INTRO_REVEAL_EASE }
            : { duration: 0 }
        }
        style={{
          pointerEvents: contentHidden ? "none" : undefined,
          visibility: contentHidden ? "hidden" : "visible",
        }}
      >
        {children}
      </motion.div>
    </>
  );
}

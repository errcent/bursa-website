"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { IntroPreloader, INTRO_REVEAL_START_MS } from "@/components/intro-preloader";

const SESSION_KEY = "bursa-intro-seen";
const REVEAL_EASE = [0.22, 1, 0.36, 1] as const;
/** Hard cap so a stuck intro never leaves the page unresponsive. */
const INTRO_FAILSAFE_MS = 3500;

type Phase = "intro" | "revealing" | "done";

function clearIntroPending() {
  document.documentElement.classList.remove("intro-pending");
  document.body.style.overflow = "";
}

export function PreloaderGate({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("done");
  const [showOverlay, setShowOverlay] = useState(false);

  useLayoutEffect(() => {
    if (prefersReducedMotion) {
      clearIntroPending();
      return;
    }

    let skipIntro = false;
    try {
      skipIntro = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      skipIntro = true;
    }

    if (skipIntro) {
      clearIntroPending();
      return;
    }

    document.body.style.overflow = "hidden";
    setPhase("intro");
    setShowOverlay(true);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (phase === "intro" || phase === "revealing" || phase === "done") {
      document.documentElement.classList.remove("intro-pending");
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
      {showOverlay && <IntroPreloader onComplete={handleIntroComplete} />}

      <motion.div
        data-app-content
        className="flex min-h-0 flex-1 flex-col"
        initial={false}
        animate={
          contentHidden
            ? { opacity: 0, y: 20 }
            : { opacity: 1, y: 0 }
        }
        transition={
          contentAnimating
            ? { duration: 0.5, ease: REVEAL_EASE }
            : { duration: 0 }
        }
        style={contentHidden ? { pointerEvents: "none" } : undefined}
      >
        {children}
      </motion.div>
    </>
  );
}

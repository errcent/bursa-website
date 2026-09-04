"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import dynamic from "next/dynamic";

import { notifyIntroExitStart } from "@/components/motion/hero-intro-timing";

const IntroPreloader = dynamic(
  () => import("@/components/intro-preloader").then((m) => m.IntroPreloader),
  { ssr: false, loading: () => null },
);

// Duplicated from intro-preloader to avoid pulling heavy canvas code into initial bundle
const INTRO_REVEAL_DURATION_S = 0.95;
const INTRO_REVEAL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

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

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    try {
      return typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } catch {
      return;
    }
  }, []);
  return reduced;
}

export function PreloaderGate({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = usePrefersReducedMotion();
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

      <div
        data-app-content
        className="flex min-h-0 flex-1 flex-col"
        style={{
          opacity: contentHidden ? 0 : 1,
          visibility: contentHidden ? "hidden" : "visible",
          pointerEvents: contentHidden ? "none" : undefined,
          transition:
            contentAnimating || contentHidden
              ? `opacity ${INTRO_REVEAL_DURATION_S}s cubic-bezier(${INTRO_REVEAL_EASE.join(",")})`
              : "none",
        }}
      >
        {children}
      </div>
    </>
  );
}

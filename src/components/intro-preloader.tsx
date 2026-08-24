"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Montserrat_Alternates } from "next/font/google";
import { useReducedMotion } from "motion/react";

import VaporizeTextCycle, { Tag } from "@/components/ui/vapour-text-effect";

const montAlt = Montserrat_Alternates({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const REVEAL_EASE = [0.22, 1, 0.36, 1] as const;
const MIN_HOLD_MS = 450;
const VAPORIZE_DURATION_S = 1.6;
const FADE_IN_DURATION_S = 0.85;
const OVERLAY_FADE_S = 0.95;

type IntroPreloaderProps = {
  onExitStart: () => void;
  onComplete: () => void;
};

function useIntroFontSize() {
  const [fontSize, setFontSize] = useState("64px");

  useEffect(() => {
    const sync = () => {
      setFontSize(window.innerWidth < 640 ? "44px" : "68px");
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return fontSize;
}

async function waitForAppReady() {
  try {
    await document.fonts.load(`700 68px ${montAlt.style.fontFamily}`);
    await document.fonts.ready;
  } catch {
    /* font load can fail in private mode */
  }

  if (document.readyState !== "complete") {
    await new Promise<void>((resolve) => {
      window.addEventListener("load", () => resolve(), { once: true });
    });
  }

  await new Promise((resolve) => window.setTimeout(resolve, MIN_HOLD_MS));
}

export function IntroPreloader({ onExitStart, onComplete }: IntroPreloaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const fontSize = useIntroFontSize();
  const [pageReady, setPageReady] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    waitForAppReady().then(() => {
      if (!cancelled) setPageReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleVaporizeComplete = useCallback(() => {
    onExitStart();
    setExiting(true);
  }, [onExitStart]);

  useEffect(() => {
    if (!exiting) return;
    const id = window.setTimeout(onComplete, OVERLAY_FADE_S * 1000);
    return () => window.clearTimeout(id);
  }, [exiting, onComplete]);

  useEffect(() => {
    if (!prefersReducedMotion || !pageReady) return;
    onExitStart();
    setExiting(true);
  }, [prefersReducedMotion, pageReady, onExitStart]);

  const font = useMemo(
    () => ({
      fontFamily: montAlt.style.fontFamily,
      fontSize,
      fontWeight: 700,
    }),
    [fontSize]
  );

  return (
    <div
      className={`intro-overlay fixed inset-0 z-[10000] flex items-center justify-center bg-black ${montAlt.className}${
        exiting ? " is-exiting" : ""
      }`}
      role="status"
      aria-live="polite"
      aria-label="Memuat Bursa"
    >
      {prefersReducedMotion ? (
        <p className="text-[44px] font-bold tracking-[-0.02em] text-[#ededed] sm:text-[68px]">
          bursa
        </p>
      ) : (
        <div className="h-[120px] w-full max-w-[min(92vw,36rem)] sm:h-[160px]">
          <VaporizeTextCycle
            texts={["bursa"]}
            font={font}
            color="rgb(237, 237, 237)"
            spread={5}
            density={5}
            animation={{
              vaporizeDuration: VAPORIZE_DURATION_S,
              fadeInDuration: FADE_IN_DURATION_S,
              waitDuration: 0.2,
            }}
            direction="left-to-right"
            alignment="center"
            tag={Tag.H1}
            playMode="hold-then-vaporize"
            vaporizeWhen={pageReady}
            onVaporizeComplete={handleVaporizeComplete}
          />
        </div>
      )}
    </div>
  );
}

export const INTRO_REVEAL_START_MS =
  (FADE_IN_DURATION_S + MIN_HOLD_MS / 1000 + VAPORIZE_DURATION_S) * 1000;
export const INTRO_REVEAL_DURATION_S = OVERLAY_FADE_S;
export const INTRO_REVEAL_EASE = REVEAL_EASE;

"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  getHeroIntroReady,
  notifyIntroExitStart,
  subscribeHeroIntroReady,
} from "@/components/motion/hero-intro-timing";

const INTRO_READY_FAILSAFE_MS = 3500;

/** False on SSR; syncs with intro gate so hero copy never stays permanently hidden. */
export function useHeroIntroReady() {
  const ready = useSyncExternalStore(
    subscribeHeroIntroReady,
    getHeroIntroReady,
    () => false
  );

  useEffect(() => {
    if (ready) return;
    const id = window.setTimeout(() => {
      notifyIntroExitStart();
    }, INTRO_READY_FAILSAFE_MS);
    return () => window.clearTimeout(id);
  }, [ready]);

  return ready;
}

"use client";

import { useEffect, useState } from "react";

import {
  getHeroIntroReady,
  INTRO_EXIT_START_EVENT,
} from "@/components/motion/hero-intro-timing";

/** False on SSR + first paint; true after intro skip/exit so hero motion does not cut behind the plate. */
export function useHeroIntroReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getHeroIntroReady()) {
      setReady(true);
      return;
    }

    const onExit = () => setReady(true);
    window.addEventListener(INTRO_EXIT_START_EVENT, onExit);
    if (getHeroIntroReady()) setReady(true);
    return () => window.removeEventListener(INTRO_EXIT_START_EVENT, onExit);
  }, []);

  return ready;
}

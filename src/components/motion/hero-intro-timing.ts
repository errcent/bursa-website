import {
  tokenizeForReveal,
  WORD_REVEAL_STAGGER,
} from "@/components/motion/word-reveal";

const SESSION_KEY = "bursa-intro-seen";
export const INTRO_EXIT_START_EVENT = "bursa-intro-exit-start";
export const HERO_HEADLINE_BASE_DELAY = 0.18;

let introExitStarted = false;

/** Fired when the black intro plate starts fading (or when intro is skipped). */
export function notifyIntroExitStart() {
  introExitStarted = true;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(INTRO_EXIT_START_EVENT));
}

export function hasSeenIntro(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Hero copy should start only after the preload plate begins exiting
 * (or immediately on return visits / reduced motion).
 */
export function subscribeHeroIntroReady(onChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const onExit = () => onChange();
  window.addEventListener(INTRO_EXIT_START_EVENT, onExit);
  return () => window.removeEventListener(INTRO_EXIT_START_EVENT, onExit);
}

export function getHeroIntroReady(): boolean {
  if (typeof window === "undefined") return false;
  if (introExitStarted) return true;
  if (hasSeenIntro()) return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  return false;
}

/** Seconds until hero copy may begin once the intro gate is open. */
export function resolveHeroIntroDelay(): number {
  return HERO_HEADLINE_BASE_DELAY;
}

/** SSR / hydration snapshot — gate opens on the client. */
export function resolveHeroIntroDelaySSR(): number {
  return HERO_HEADLINE_BASE_DELAY;
}

/** Delay for hero subcopy, chains continuously after headline word stagger. */
export function resolveHeroSubcopyDelay(headlineLines: string[]): number {
  return resolveHeroSubcopyDelayFromBase(headlineLines, resolveHeroIntroDelay());
}

export function resolveHeroSubcopyDelaySSR(headlineLines: string[]): number {
  return resolveHeroSubcopyDelayFromBase(headlineLines, resolveHeroIntroDelaySSR());
}

function resolveHeroSubcopyDelayFromBase(headlineLines: string[], base: number): number {
  const totalWords = headlineLines.reduce(
    (sum, line) => sum + tokenizeForReveal(line).length,
    0
  );

  if (totalWords <= 0) return base + 0.08;

  return base + totalWords * WORD_REVEAL_STAGGER + 0.08;
}

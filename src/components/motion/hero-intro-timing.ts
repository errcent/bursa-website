import { INTRO_REVEAL_START_MS } from "@/components/intro-preloader";
import {
  tokenizeForReveal,
  WORD_REVEAL_STAGGER,
} from "@/components/motion/word-reveal";

const SESSION_KEY = "bursa-intro-seen";
const HERO_HEADLINE_BASE_DELAY = 0.12;

/** Seconds until hero copy may begin (after intro radial exit, or immediately on return visits). */
export function resolveHeroIntroDelay(): number {
  try {
    const skipIntro = sessionStorage.getItem(SESSION_KEY) === "1";
    return skipIntro ? HERO_HEADLINE_BASE_DELAY : INTRO_REVEAL_START_MS / 1000 + HERO_HEADLINE_BASE_DELAY;
  } catch {
    return HERO_HEADLINE_BASE_DELAY;
  }
}

/** SSR / hydration snapshot — first-visit intro timing (no sessionStorage). */
export function resolveHeroIntroDelaySSR(): number {
  return INTRO_REVEAL_START_MS / 1000 + HERO_HEADLINE_BASE_DELAY;
}

/** Delay for hero subcopy — chains continuously after headline word stagger (Atom-style). */
export function resolveHeroSubcopyDelay(headlineLines: string[]): number {
  const base = resolveHeroIntroDelay();
  return resolveHeroSubcopyDelayFromBase(headlineLines, base);
}

/** SSR-safe subcopy delay — matches first-visit timing for hydration. */
export function resolveHeroSubcopyDelaySSR(headlineLines: string[]): number {
  return resolveHeroSubcopyDelayFromBase(headlineLines, resolveHeroIntroDelaySSR());
}

function resolveHeroSubcopyDelayFromBase(headlineLines: string[], base: number): number {
  const totalWords = headlineLines.reduce(
    (sum, line) => sum + tokenizeForReveal(line).length,
    0
  );

  if (totalWords <= 0) return base + 0.08;

  return base + totalWords * WORD_REVEAL_STAGGER + 0.06;
}

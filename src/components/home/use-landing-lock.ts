import { useSyncExternalStore } from "react";

const LANDING_LOCK_QUERY = "(max-width: 768px), (pointer: coarse)";

function subscribeLandingLock(onChange: () => void) {
  const media = window.matchMedia(LANDING_LOCK_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getLandingLock() {
  return window.matchMedia(LANDING_LOCK_QUERY).matches;
}

/** Sticky chrome instead of JS-fixed hero dock. SSR assumes desktop to keep the dock. */
export function useLandingLock() {
  return useSyncExternalStore(subscribeLandingLock, getLandingLock, () => false);
}

export { LANDING_LOCK_QUERY };

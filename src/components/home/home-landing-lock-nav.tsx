"use client";

import { HeroNavContext } from "@/components/hero-nav-context";
import { SiteNavbar } from "@/components/site-navbar";
import { useLandingLock } from "@/components/home/use-landing-lock";

const LOCKED_NAV = {
  pinned: true,
  searchVisible: true,
  searchReveal: true,
} as const;

export function HomeLandingLockNav() {
  const locked = useLandingLock();
  if (!locked) return null;

  return (
    <HeroNavContext.Provider value={LOCKED_NAV}>
      <SiteNavbar />
    </HeroNavContext.Provider>
  );
}

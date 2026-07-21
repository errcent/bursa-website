"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { HeroNavContext } from "@/components/hero-nav-context";

/** Pixels over which dock → pin visuals ease in/out (bg opacity, search reveal). */
const PIN_EASE_PX = 88;

const SEARCH_REVEAL_THRESHOLD = 0.58;
const SEARCH_VISIBLE_THRESHOLD = 0.06;

/**
 * Keeps the navbar docked to the bottom of a full-viewport hero until scroll
 * would push it past the viewport top — then pins it at the top.
 *
 * Position + glass/search progress vars are updated directly on the DOM each frame
 * after hydration (no React state per scroll tick) so movement stays 1:1 with scroll.
 * Search visibility classes are React state (threshold crossings only).
 */
export function HeroNavSlot({ children }: { children: React.ReactNode }) {
  const slotRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(false);
  const searchVisibleRef = useRef(false);
  const searchRevealedRef = useRef(false);
  const reservedHeightRef = useRef(0);
  const [hydrated, setHydrated] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchReveal, setSearchReveal] = useState(false);
  const [reservedHeight, setReservedHeight] = useState(0);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useLayoutEffect(() => {
    if (!hydrated) return;

    const inner = innerRef.current;
    if (!inner) return;

    const measure = () => {
      const height = inner.offsetHeight;
      reservedHeightRef.current = height;
      setReservedHeight(height);
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    const slot = slotRef.current;
    const inner = innerRef.current;
    if (!slot || !inner) return;

    const hero = slot.closest("section");
    if (!hero) return;

    const applyFrame = () => {
      const navHeight = reservedHeightRef.current;
      if (navHeight <= 0) return;

      const heroRect = hero.getBoundingClientRect();
      const dockTop = heroRect.bottom - navHeight;
      const progress = Math.min(1, Math.max(0, 1 - dockTop / PIN_EASE_PX));
      const nextTop = Math.max(0, dockTop);
      const nextPinned = dockTop <= 0;
      const nextSearchVisible = progress > SEARCH_VISIBLE_THRESHOLD;
      const nextSearchReveal = progress > SEARCH_REVEAL_THRESHOLD;

      inner.style.transform = "";
      inner.style.top = `${nextTop}px`;
      inner.dataset.pinned = nextPinned ? "true" : "false";

      const navGlass = inner.querySelector<HTMLElement>("[data-hero-nav-glass]");
      // Single glass path: strength 0→1 matches Katalog `.nav-glass` at 1 — no class swap at pin.
      const glassStrength = nextPinned ? 1 : progress;
      const blurPx = `${glassStrength * 24}px`;
      navGlass?.style.setProperty("--nav-glass-strength", String(glassStrength));
      // Inline blur survives prod CSS minifier dropping unprefixed backdrop-filter next to -webkit-.
      navGlass?.style.setProperty("backdrop-filter", `blur(${blurPx})`);
      navGlass?.style.setProperty("-webkit-backdrop-filter", `blur(${blurPx})`);

      const searchSlot = inner.querySelector<HTMLElement>("[data-hero-nav-search]");
      searchSlot?.style.setProperty("--search-reveal", String(progress));

      if (searchVisibleRef.current !== nextSearchVisible) {
        searchVisibleRef.current = nextSearchVisible;
        setSearchVisible(nextSearchVisible);
      }

      if (searchRevealedRef.current !== nextSearchReveal) {
        searchRevealedRef.current = nextSearchReveal;
        setSearchReveal(nextSearchReveal);
      }

      if (pinnedRef.current !== nextPinned) {
        pinnedRef.current = nextPinned;
        setPinned(nextPinned);
      }
    };

    const onScroll = () => {
      applyFrame();
    };

    applyFrame();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [hydrated]);

  const floatNode = (
    <div
      ref={innerRef}
      className="hero-nav-float hero-nav-float--pad fixed inset-x-0 top-0 z-50"
      data-pinned={pinned ? "true" : "false"}
    >
      {children}
    </div>
  );

  return (
    <HeroNavContext.Provider value={{ pinned, searchVisible, searchReveal }}>
      <div
        ref={slotRef}
        className="hero-nav-slot relative shrink-0"
        style={reservedHeight > 0 ? { minHeight: reservedHeight } : undefined}
        aria-hidden
      />
      {/* Portaled to body so hero-cinematic isolation can't trap fixed nav stacking/backdrop. */}
      {hydrated ? createPortal(floatNode, document.body) : null}
    </HeroNavContext.Provider>
  );
}

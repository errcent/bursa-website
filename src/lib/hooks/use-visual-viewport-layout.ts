"use client";

import { useEffect, useState } from "react";

export type VisualViewportLayout = {
  height: number;
  offsetTop: number;
  bottomInset: number;
};

const EMPTY: VisualViewportLayout = { height: 0, offsetTop: 0, bottomInset: 0 };

/**
 * Tracks visual viewport for mobile keyboard: shrink usable height, pin document scroll.
 */
export function useVisualViewportLayout(enabled: boolean): VisualViewportLayout {
  const [layout, setLayout] = useState<VisualViewportLayout>(EMPTY);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setLayout(EMPTY);
      return;
    }

    const vv = window.visualViewport;
    if (!vv) return;

    let raf = 0;

    const pinDocumentScroll = () => {
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };

    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const bottomInset = Math.max(
          0,
          Math.round(window.innerHeight - vv.height - vv.offsetTop)
        );
        setLayout({
          height: Math.round(vv.height),
          offsetTop: Math.round(vv.offsetTop),
          bottomInset,
        });
        pinDocumentScroll();
      });
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("scroll", pinDocumentScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("scroll", pinDocumentScroll);
    };
  }, [enabled]);

  return layout;
}

/** @deprecated Prefer useVisualViewportLayout */
export function useVisualViewportBottomInset(enabled: boolean): number {
  const { bottomInset } = useVisualViewportLayout(enabled);
  return bottomInset;
}

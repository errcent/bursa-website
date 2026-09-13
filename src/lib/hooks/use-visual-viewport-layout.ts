"use client";

import { useEffect, type RefObject } from "react";

export type VisualViewportLayout = {
  height: number;
  offsetTop: number;
  bottomInset: number;
};

/**
 * Updates CSS vars on a target element from visualViewport — no React re-renders (avoids keyboard jitter).
 */
export function useVisualViewportCssVars(
  targetRef: RefObject<HTMLElement | null>,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const vv = window.visualViewport;
    if (!vv) return;

    let raf = 0;
    let lastHeight = 0;

    const apply = (el: HTMLElement) => {
      const height = Math.round(vv.height);
      if (height === lastHeight) return;
      lastHeight = height;
      el.style.setProperty("--vv-height", `${height}px`);
    };

    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = targetRef.current;
        if (!el) return;
        apply(el);
      });
    };

    const el = targetRef.current;
    if (el) {
      lastHeight = Math.round(vv.height);
      el.style.setProperty("--vv-height", `${lastHeight}px`);
    }

    vv.addEventListener("resize", update);

    return () => {
      cancelAnimationFrame(raf);
      vv.removeEventListener("resize", update);
      const node = targetRef.current;
      if (node) node.style.removeProperty("--vv-height");
    };
  }, [enabled, targetRef]);
}

/** @deprecated Prefer useVisualViewportCssVars */
export function useVisualViewportLayout(_enabled: boolean): VisualViewportLayout {
  return { height: 0, offsetTop: 0, bottomInset: 0 };
}

/** @deprecated Prefer useVisualViewportCssVars */
export function useVisualViewportBottomInset(_enabled: boolean): number {
  return 0;
}

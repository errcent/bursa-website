"use client";

import { useCallback, useRef } from "react";
import type { MouseEvent, PointerEvent as ReactPointerEvent } from "react";

/** Minimum pointer travel (px) before a carousel interaction counts as drag, not click. */
export const CAROUSEL_DRAG_CLICK_THRESHOLD_PX = 12;

/** Minimum horizontal scroll delta (px) during a pointer gesture to suppress link clicks. */
export const CAROUSEL_SCROLL_CLICK_THRESHOLD_PX = 4;

export function shouldSuppressCarouselClick(
  pointerTravelPx: number,
  scrollDeltaPx = 0
): boolean {
  return (
    pointerTravelPx >= CAROUSEL_DRAG_CLICK_THRESHOLD_PX ||
    scrollDeltaPx >= CAROUSEL_SCROLL_CLICK_THRESHOLD_PX
  );
}

export function useCarouselClickGuard() {
  const suppressRef = useRef(false);
  const activeRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const maxTravelRef = useRef(0);

  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    activeRef.current = true;
    startRef.current = { x: e.clientX, y: e.clientY };
    maxTravelRef.current = 0;
    suppressRef.current = false;
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent) => {
    if (!activeRef.current) return;
    const dx = Math.abs(e.clientX - startRef.current.x);
    const dy = Math.abs(e.clientY - startRef.current.y);
    maxTravelRef.current = Math.max(maxTravelRef.current, dx, dy);
  }, []);

  const finalizePointer = useCallback((scrollDeltaPx = 0) => {
    if (!activeRef.current) return;
    activeRef.current = false;
    suppressRef.current = shouldSuppressCarouselClick(
      maxTravelRef.current,
      scrollDeltaPx
    );
  }, []);

  const onPointerUp = useCallback(
    (scrollDeltaPx = 0) => {
      finalizePointer(scrollDeltaPx);
    },
    [finalizePointer]
  );

  const onPointerCancel = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    suppressRef.current = shouldSuppressCarouselClick(maxTravelRef.current, 0);
  }, []);

  const noteDragTravel = useCallback((px: number) => {
    maxTravelRef.current = Math.max(maxTravelRef.current, px);
    if (px >= CAROUSEL_DRAG_CLICK_THRESHOLD_PX) {
      suppressRef.current = true;
    }
  }, []);

  const onClickCapture = useCallback((e: MouseEvent) => {
    if (suppressRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
    suppressRef.current = false;
    maxTravelRef.current = 0;
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onClickCapture,
    noteDragTravel,
  };
}

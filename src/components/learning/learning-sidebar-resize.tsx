"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const STORAGE_KEY = "bursa-lesson-sidebar-width";
export const SIDEBAR_WIDTH_MIN = 260;
export const SIDEBAR_WIDTH_MAX = 560;
export const SIDEBAR_WIDTH_DEFAULT = 300;
const NOTES_TAB_BOOST = 360;

export function useLearningSidebarWidth(notesActive: boolean) {
  const [width, setWidth] = useState(SIDEBAR_WIDTH_DEFAULT);
  const widthRef = useRef(SIDEBAR_WIDTH_DEFAULT);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        const clamped = Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, parsed));
        setWidth(clamped);
        widthRef.current = clamped;
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!notesActive) return;
    setWidth((prev) => {
      const next = Math.max(prev, NOTES_TAB_BOOST);
      widthRef.current = next;
      return next;
    });
  }, [notesActive]);

  const persist = useCallback((value: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      /* ignore */
    }
  }, []);

  const applyWidth = useCallback(
    (next: number) => {
      const clamped = Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, next));
      setWidth(clamped);
      widthRef.current = clamped;
    },
    []
  );

  return { width, widthRef, applyWidth, persist };
}

type LearningSidebarResizeHandleProps = {
  containerRef: React.RefObject<HTMLElement | null>;
  onWidthChange: (width: number) => void;
  onWidthCommit: (width: number) => void;
  widthRef: React.MutableRefObject<number>;
  className?: string;
};

export function LearningSidebarResizeHandle({
  containerRef,
  onWidthChange,
  onWidthCommit,
  widthRef,
  className,
}: LearningSidebarResizeHandleProps) {
  const dragging = useRef(false);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const next = rect.right - event.clientX;
      onWidthChange(next);
    },
    [containerRef, onWidthChange]
  );

  const endDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;
      dragging.current = false;
      event.currentTarget.releasePointerCapture(event.pointerId);
      onWidthCommit(widthRef.current);
    },
    [onWidthCommit, widthRef]
  );

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Sesuaikan lebar panel samping"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          const next = Math.min(SIDEBAR_WIDTH_MAX, widthRef.current + 12);
          onWidthChange(next);
          onWidthCommit(next);
        }
        if (e.key === "ArrowRight") {
          const next = Math.max(SIDEBAR_WIDTH_MIN, widthRef.current - 12);
          onWidthChange(next);
          onWidthCommit(next);
        }
      }}
      className={cn(
        "absolute inset-y-0 -left-1.5 z-20 hidden w-3 cursor-col-resize touch-none lg:flex lg:items-center lg:justify-center",
        className
      )}
    >
      <span className="h-12 w-1 rounded-full bg-border transition-colors hover:bg-foreground/35" />
    </div>
  );
}

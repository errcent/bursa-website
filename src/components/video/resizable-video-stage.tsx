"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_WIDTH_PCT = 60;
const MAX_WIDTH_PCT = 100;
const DEFAULT_WIDTH_PCT = 94;
const STORAGE_KEY = "bursa-lesson-player-width";

interface ResizableVideoStageProps {
  children: React.ReactNode;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  className?: string;
}

export function ResizableVideoStage({
  children,
  expanded,
  onExpandedChange,
  className,
}: ResizableVideoStageProps) {
  const [widthPct, setWidthPct] = useState(DEFAULT_WIDTH_PCT);
  const dragging = useRef(false);
  const latestWidth = useRef(DEFAULT_WIDTH_PCT);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        const clamped = Math.min(MAX_WIDTH_PCT, Math.max(MIN_WIDTH_PCT, parsed));
        setWidthPct(clamped);
        latestWidth.current = clamped;
        if (clamped >= 98) onExpandedChange(true);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once
  }, []);

  const persist = useCallback((value: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      /* ignore */
    }
  }, []);

  const applyWidth = useCallback(
    (next: number) => {
      const clamped = Math.min(MAX_WIDTH_PCT, Math.max(MIN_WIDTH_PCT, next));
      setWidthPct(clamped);
      latestWidth.current = clamped;
      onExpandedChange(clamped >= 98);
    },
    [onExpandedChange]
  );

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragging.current = true;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;
      const parent = event.currentTarget.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      applyWidth(((event.clientX - rect.left) / rect.width) * 100);
    },
    [applyWidth]
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;
      dragging.current = false;
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
      persist(latestWidth.current);
    },
    [persist]
  );

  function toggleExpand() {
    if (expanded) {
      onExpandedChange(false);
      applyWidth(DEFAULT_WIDTH_PCT);
      persist(DEFAULT_WIDTH_PCT);
    } else {
      onExpandedChange(true);
      applyWidth(100);
      persist(100);
    }
  }

  return (
    <div
      className={cn("relative mx-auto w-full", className)}
      style={{ maxWidth: expanded ? "100%" : `${widthPct}%` }}
    >
      <div className="mb-2 flex items-center justify-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={toggleExpand}
          className="h-8 gap-1.5 text-xs"
        >
          {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          {expanded ? "Layout normal" : "Perbesar video"}
        </Button>
      </div>

      <div className="relative w-full">
        {children}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Sesuaikan lebar video"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              applyWidth(widthPct - 2);
              persist(Math.max(MIN_WIDTH_PCT, widthPct - 2));
            }
            if (e.key === "ArrowRight") {
              applyWidth(widthPct + 2);
              persist(Math.min(MAX_WIDTH_PCT, widthPct + 2));
            }
          }}
          className="absolute inset-y-0 -right-1 z-10 hidden w-3 cursor-col-resize touch-none sm:flex sm:items-center sm:justify-center"
        >
          <span className="h-10 w-1 rounded-full bg-foreground/20 transition-colors hover:bg-foreground/40" />
        </div>
      </div>
    </div>
  );
}

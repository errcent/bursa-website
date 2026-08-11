"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface SearchPlaceholderMarqueeProps {
  text: string;
  className?: string;
}

/** Only marquee when overflow is clearly larger than the slot (avoids clipped partial text). */
const MARQUEE_OVERFLOW_PX = 24;

export function SearchPlaceholderMarquee({ text, className }: SearchPlaceholderMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    function checkOverflow() {
      const overflow = textEl!.scrollWidth - container!.clientWidth;
      setShouldAnimate(overflow > MARQUEE_OVERFLOW_PX);
    }

    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(container);
    return () => observer.disconnect();
  }, [text]);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      {shouldAnimate ? (
        <div className="flex w-max items-center text-sm text-muted-foreground animate-search-marquee">
          <span ref={textRef} className="whitespace-nowrap pr-8">
            {text}
          </span>
          <span className="whitespace-nowrap pr-8">{text}</span>
        </div>
      ) : (
        <span ref={textRef} className="block truncate text-sm text-muted-foreground">
          {text}
        </span>
      )}
    </div>
  );
}

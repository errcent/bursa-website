"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface SearchPlaceholderMarqueeProps {
  text: string;
  className?: string;
}

export function SearchPlaceholderMarquee({ text, className }: SearchPlaceholderMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    function checkOverflow() {
      setShouldAnimate(textEl!.scrollWidth > container!.clientWidth + 2);
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
      <div
        className={cn(
          "flex w-max items-center text-sm text-muted-foreground",
          shouldAnimate && "animate-search-marquee"
        )}
      >
        <span ref={textRef} className="whitespace-nowrap pr-8">
          {text}
        </span>
        {shouldAnimate ? (
          <span className="whitespace-nowrap pr-8">{text}</span>
        ) : null}
      </div>
    </div>
  );
}

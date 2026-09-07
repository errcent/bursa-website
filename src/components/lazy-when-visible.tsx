"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type LazyWhenVisibleProps = {
  children: ReactNode;
  className?: string;
  /** Reserve space before mount to avoid layout shift. */
  minHeight?: number;
  rootMargin?: string;
};

/** Mount children only when near the viewport — cuts initial DOM on long catalog pages. */
export function LazyWhenVisible({
  children,
  className,
  minHeight = 260,
  rootMargin = "320px 0px",
}: LazyWhenVisibleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} className={cn(className, !visible && "content-visibility-auto")}>
      {visible ? (
        children
      ) : (
        <div aria-hidden className="w-full rounded-xl bg-muted/15" style={{ minHeight }} />
      )}
    </div>
  );
}

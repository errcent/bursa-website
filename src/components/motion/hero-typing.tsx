"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export function HeroTyping({
  text,
  className,
  speed = 42,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(prefersReducedMotion ? text : "");
  const [done, setDone] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayed(text);
      setDone(true);
      return;
    }

    setDisplayed("");
    setDone(false);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(id);
        setDone(true);
      }
    }, speed);

    return () => window.clearInterval(id);
  }, [text, speed, prefersReducedMotion]);

  return (
    <span className={cn("font-mono", className)} aria-label={text}>
      <span aria-hidden>{displayed}</span>
      {!done && <span className="terminal-cursor" aria-hidden />}
    </span>
  );
}

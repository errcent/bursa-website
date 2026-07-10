"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

export function CursorGlow() {
  const prefersReducedMotion = useReducedMotion();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };
    const onLeave = () => setVisible(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion || !visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] hidden transition-opacity duration-500 md:block"
      style={{
        background: `radial-gradient(520px circle at ${pos.x}px ${pos.y}px, rgba(163, 163, 163, 0.04), transparent 65%)`,
      }}
    />
  );
}

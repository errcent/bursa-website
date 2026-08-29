"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "motion/react";

/** Soft pointer wash — landing hero only. Hidden again when the landasan ring cursor is on. */
export function CursorGlow() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  const onLanding = pathname === "/";

  useEffect(() => {
    if (prefersReducedMotion || !onLanding) {
      setVisible(false);
      return;
    }

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
  }, [prefersReducedMotion, onLanding]);

  if (!onLanding || prefersReducedMotion || !visible) return null;

  return (
    <div
      aria-hidden
      className="cursor-glow pointer-events-none fixed inset-0 z-[1] hidden transition-opacity duration-500 md:block"
      style={{
        background: `radial-gradient(520px circle at ${pos.x}px ${pos.y}px, rgba(163, 163, 163, 0.04), transparent 65%)`,
      }}
    />
  );
}

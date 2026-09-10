"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "motion/react";

/** Soft pointer wash  -  landing hero only. Hidden again when the landasan ring cursor is on. */
export function CursorGlow() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef({ x: 0, y: 0, visible: false });

  const onLanding = pathname === "/";

  useEffect(() => {
    const el = glowRef.current;
    if (!el || prefersReducedMotion || !onLanding) return;

    const flush = () => {
      rafRef.current = null;
      const { x, y, visible } = pendingRef.current;
      el.style.setProperty("--glow-x", `${x}px`);
      el.style.setProperty("--glow-y", `${y}px`);
      el.style.opacity = visible ? "1" : "0";
    };

    const schedule = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(flush);
    };

    const onMove = (e: MouseEvent) => {
      pendingRef.current = { x: e.clientX, y: e.clientY, visible: true };
      schedule();
    };
    const onLeave = () => {
      pendingRef.current.visible = false;
      schedule();
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [prefersReducedMotion, onLanding]);

  if (!onLanding || prefersReducedMotion) return null;

  return (
    <div
      ref={glowRef}
      aria-hidden
      className="cursor-glow pointer-events-none fixed inset-0 z-[1] hidden opacity-0 md:block"
      style={{
        background:
          "radial-gradient(520px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(163, 163, 163, 0.04), transparent 65%)",
      }}
    />
  );
}

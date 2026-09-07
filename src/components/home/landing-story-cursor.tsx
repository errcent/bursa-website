"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

const RING = 28;
const RADIUS = 11;
const HALF = RING / 2;

/**
 * Landing landasan cursor.
 * Position updates via rAF + direct DOM transform (1:1 with pointer).
 * Spring only for hover scale, scroll fill, and opacity.
 */
export function LandingStoryCursor({ progress }: { progress: MotionValue<number> }) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef({ x: -80, y: -80, visible: 0, hover: 0 });

  const hover = useMotionValue(0);
  const visible = useMotionValue(0);

  const fill = useSpring(progress, { stiffness: 150, damping: 28, mass: 0.35 });
  const dashOffset = useTransform(fill, (value) => 1 - Math.min(1, Math.max(0, value)));
  const scale = useSpring(useTransform(hover, [0, 1], [1, 1.28]), {
    stiffness: 900,
    damping: 38,
    mass: 0.2,
  });
  const coreRadius = useSpring(useTransform(hover, [0, 1], [1.15, 3.4]), {
    stiffness: 900,
    damping: 38,
    mass: 0.2,
  });
  const opacity = useTransform(visible, [0, 1], [0, 1]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    document.documentElement.classList.add("landing-story-cursor-on");

    const flush = () => {
      rafRef.current = null;
      const el = cursorRef.current;
      if (!el) return;
      const { x, y, visible: vis } = pendingRef.current;
      el.style.transform = `translate3d(${x - HALF}px, ${y - HALF}px, 0)`;
      el.style.opacity = vis ? "1" : "0";
      visible.set(vis);
      hover.set(pendingRef.current.hover);
    };

    const schedule = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(flush);
    };

    const onMove = (event: PointerEvent) => {
      const target = event.target;
      pendingRef.current = {
        x: event.clientX,
        y: event.clientY,
        visible: 1,
        hover:
          target instanceof Element &&
          target.closest("a, button, [role='button'], input, textarea, select, label, summary")
            ? 1
            : 0,
      };
      schedule();
    };
    const onLeave = () => {
      pendingRef.current.visible = 0;
      schedule();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      document.documentElement.classList.remove("landing-story-cursor-on");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [hover, reduceMotion, visible]);

  if (!mounted || reduceMotion) return null;

  return createPortal(
    <div ref={cursorRef} aria-hidden className="landing-story-cursor" style={{ opacity: 0 }}>
      <motion.div style={{ scale, opacity }}>
        <svg
          className="landing-story-cursor__svg"
          width={RING}
          height={RING}
          viewBox={`0 0 ${RING} ${RING}`}
        >
          <circle className="landing-story-cursor__track" cx={HALF} cy={HALF} r={RADIUS} />
          <motion.circle
            className="landing-story-cursor__fill"
            cx={HALF}
            cy={HALF}
            r={RADIUS}
            pathLength={1}
            strokeDasharray="1 1"
            style={{ strokeDashoffset: dashOffset }}
          />
          <motion.circle
            className="landing-story-cursor__core"
            cx={HALF}
            cy={HALF}
            r={coreRadius}
          />
        </svg>
      </motion.div>
    </div>,
    document.body
  );
}

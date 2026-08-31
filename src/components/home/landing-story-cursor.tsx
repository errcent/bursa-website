"use client";

import { useEffect, useState } from "react";
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

/**
 * Landing landasan cursor.
 * Uses mix-blend-mode: difference so the ring stays visible on both black and white.
 * Idle = thin ring + tiny core. Interactive = thicker ring + solid core (clickable cue).
 */
export function LandingStoryCursor({ progress }: { progress: MotionValue<number> }) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const x = useMotionValue(-80);
  const y = useMotionValue(-80);
  const visible = useMotionValue(0);
  const hover = useMotionValue(0);

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

    const onMove = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      visible.set(1);
      const target = event.target;
      hover.set(
        target instanceof Element &&
          target.closest("a, button, [role='button'], input, textarea, select, label, summary")
          ? 1
          : 0
      );
    };
    const onLeave = () => visible.set(0);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      document.documentElement.classList.remove("landing-story-cursor-on");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [hover, reduceMotion, visible, x, y]);

  if (!mounted || reduceMotion) return null;

  return createPortal(
    <motion.div
      aria-hidden
      className="landing-story-cursor"
      style={{ x, y, scale, opacity }}
    >
      <svg
        className="landing-story-cursor__svg"
        width={RING}
        height={RING}
        viewBox={`0 0 ${RING} ${RING}`}
      >
        <circle className="landing-story-cursor__track" cx={RING / 2} cy={RING / 2} r={RADIUS} />
        <motion.circle
          className="landing-story-cursor__fill"
          cx={RING / 2}
          cy={RING / 2}
          r={RADIUS}
          pathLength={1}
          strokeDasharray="1 1"
          style={{ strokeDashoffset: dashOffset }}
        />
        <motion.circle
          className="landing-story-cursor__core"
          cx={RING / 2}
          cy={RING / 2}
          r={coreRadius}
        />
      </svg>
    </motion.div>,
    document.body
  );
}

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
 * Position writes synchronously on pointermove (true 1:1).
 * Spring only for hover scale, scroll fill, and opacity.
 * Failsafe: if tracking dies, restore the OS cursor.
 */
export function LandingStoryCursor({ progress }: { progress: MotionValue<number> }) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const lastHoverRef = useRef(0);
  const lastVisibleRef = useRef(0);
  const lastMoveAtRef = useRef(0);
  const failsafeRef = useRef<number | null>(null);

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

    const root = document.documentElement;
    root.classList.add("landing-story-cursor-on");

    const hideCustom = () => {
      const el = cursorRef.current;
      if (el) el.style.opacity = "0";
      if (lastVisibleRef.current !== 0) {
        lastVisibleRef.current = 0;
        visible.set(0);
      }
    };

    const armFailsafe = () => {
      if (failsafeRef.current !== null) window.clearInterval(failsafeRef.current);
      failsafeRef.current = window.setInterval(() => {
        // OS cursor hidden but custom stopped updating → unblock the user.
        if (Date.now() - lastMoveAtRef.current > 1200 && lastVisibleRef.current === 1) {
          root.classList.remove("landing-story-cursor-on");
          hideCustom();
        }
      }, 400);
    };

    const onMove = (event: PointerEvent) => {
      const el = cursorRef.current;
      if (!el) return;

      lastMoveAtRef.current = Date.now();
      // Re-enable hide if failsafe restored the OS cursor.
      if (!root.classList.contains("landing-story-cursor-on")) {
        root.classList.add("landing-story-cursor-on");
      }

      // Sync write - no rAF gate (avoids lag under scroll Motion + stuck rafRef).
      el.style.transform = `translate3d(${event.clientX - HALF}px, ${event.clientY - HALF}px, 0)`;
      el.style.opacity = "1";

      if (lastVisibleRef.current !== 1) {
        lastVisibleRef.current = 1;
        visible.set(1);
      }

      const target = event.target;
      const nextHover =
        target instanceof Element &&
        target.closest("a, button, [role='button'], input, textarea, select, label, summary")
          ? 1
          : 0;
      if (nextHover !== lastHoverRef.current) {
        lastHoverRef.current = nextHover;
        hover.set(nextHover);
      }
    };

    const onLeave = () => {
      hideCustom();
    };

    armFailsafe();
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      root.classList.remove("landing-story-cursor-on");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      if (failsafeRef.current !== null) {
        window.clearInterval(failsafeRef.current);
        failsafeRef.current = null;
      }
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

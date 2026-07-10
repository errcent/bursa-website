"use client";

import { useEffect, useMemo, useState } from "react";
import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Transition,
  type Variants,
} from "motion/react";

import { cn } from "@/lib/utils";

const SNAP_IN_EASE = [0.16, 1, 0.3, 1] as const;
const SNAP_OUT_EASE = [0.55, 0, 1, 0.45] as const;
const DUST_COUNT = 32;

type DustParticle = {
  id: number;
  left: string;
  top: string;
  size: number;
  dx: number;
  dy: number;
};

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function buildDustParticles(seed: number): DustParticle[] {
  return Array.from({ length: DUST_COUNT }, (_, i) => {
    const r1 = seededRandom(seed + i * 3.7);
    const r2 = seededRandom(seed + i * 7.1);
    const r3 = seededRandom(seed + i * 11.3);
    return {
      id: i,
      left: `${(6 + r1 * 88).toFixed(2)}%`,
      top: `${(4 + r2 * 92).toFixed(2)}%`,
      size: 1.5 + r3 * 3.5,
      dx: Number(((r1 - 0.5) * 160).toFixed(2)),
      dy: Number((-16 - r2 * 96).toFixed(2)),
    };
  });
}

export const snapInTransition: Transition = {
  duration: 0.58,
  ease: SNAP_IN_EASE,
};

export const snapOutTransition: Transition = {
  duration: 0.52,
  ease: SNAP_OUT_EASE,
};

export const snapRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    filter: "blur(10px) brightness(1.16)",
    y: 18,
    rotate: -0.5,
  },
  show: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px) brightness(1)",
    y: 0,
    rotate: 0,
    transition: snapInTransition,
  },
  exit: {
    opacity: 0,
    scale: 1.08,
    filter: "blur(20px) brightness(1.55)",
    y: -42,
    rotate: 1.8,
    transition: snapOutTransition,
  },
};

export const snapStaggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

export const snapStaggerItem: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    filter: "blur(8px) brightness(1.14)",
    y: 20,
    rotate: -0.6,
  },
  show: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px) brightness(1)",
    y: 0,
    rotate: 0,
    transition: snapInTransition,
  },
};

const dustFieldVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.01, delayChildren: 0.02 },
  },
  exit: {
    transition: { staggerChildren: 0.008, staggerDirection: -1 },
  },
};

const dustParticleVariants: Variants = {
  hidden: (particle: DustParticle) => ({
    opacity: 0.75,
    scale: 1,
    x: particle.dx,
    y: particle.dy,
  }),
  show: {
    opacity: 0,
    scale: 0,
    x: 0,
    y: 0,
    transition: { duration: 0.58, ease: SNAP_IN_EASE },
  },
  exit: (particle: DustParticle) => ({
    opacity: [0, 0.85, 0],
    scale: [0, 1.15, 0.25],
    x: [0, particle.dx * 0.45, particle.dx],
    y: [0, particle.dy * 0.45, particle.dy],
    transition: { duration: 0.5, ease: SNAP_OUT_EASE, times: [0, 0.3, 1] },
  }),
};

function SnapDustField({ seed }: { seed: number }) {
  const [mounted, setMounted] = useState(false);
  const particles = useMemo(() => buildDustParticles(seed), [seed]);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
      variants={dustFieldVariants}
      initial={false}
    >
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          custom={particle}
          variants={dustParticleVariants}
          initial={false}
          className="absolute rounded-full bg-muted-foreground/75 shadow-[0_0_6px_var(--glow)]"
          style={{
            left: particle.left,
            top: particle.top,
            width: `${particle.size.toFixed(2)}px`,
            height: `${particle.size.toFixed(2)}px`,
          }}
        />
      ))}
    </motion.div>
  );
}

export function SnapPresence({
  children,
  className,
  seed = 1,
  delay = 0,
  ...props
}: HTMLMotionProps<"div"> & { seed?: number; delay?: number }) {
  const prefersReducedMotion = useReducedMotion();
  const childNodes = children as React.ReactNode;

  if (prefersReducedMotion) {
    return <div className={className}>{childNodes}</div>;
  }

  return (
    <motion.div
      className={cn("relative", className)}
      initial="hidden"
      animate="show"
      exit="exit"
      variants={snapRevealVariants}
      transition={{ ...snapInTransition, delay }}
      {...props}
    >
      <SnapDustField seed={seed} />
      <div className="relative z-[1]">{childNodes}</div>
    </motion.div>
  );
}

export function SnapCollapse({
  children,
  className,
  seed = 2,
}: {
  children: React.ReactNode;
  className?: string;
  seed?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("relative overflow-hidden", className)}
      initial="hidden"
      animate="show"
      exit="exit"
      variants={{
        hidden: {
          opacity: 0,
          height: 0,
          filter: "blur(10px) brightness(1.3)",
        },
        show: {
          opacity: 1,
          height: "auto",
          filter: "blur(0px) brightness(1)",
          transition: { duration: 0.55, ease: SNAP_IN_EASE },
        },
        exit: {
          opacity: 0,
          height: 0,
          filter: "blur(12px) brightness(1.4)",
          transition: { duration: 0.42, ease: SNAP_OUT_EASE },
        },
      }}
    >
      <SnapDustField seed={seed} />
      <div className="relative z-[1]">{children}</div>
    </motion.div>
  );
}

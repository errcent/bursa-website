"use client";

import { useEffect, useState } from "react";
import { motion, type HTMLMotionProps, useReducedMotion } from "motion/react";

import {
  snapInTransition,
  snapStaggerContainer,
  snapStaggerItem,
} from "@/components/motion/snap";
import { cn } from "@/lib/utils";

type RevealProps = HTMLMotionProps<"div"> & {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  x?: number;
  scale?: number;
  once?: boolean;
};

/**
 * Premium motion rule: never leave content at opacity 0.
 * Animate translate/blur only so print, screenshot, and fast scroll stay readable.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
  x = 0,
  scale = 1,
  once = true,
  ...props
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (prefersReducedMotion) {
    return <div className={cn(className)}>{children}</div>;
  }

  const motionY = isMobile ? Math.min(y, 10) : y;

  return (
    <motion.div
      className={cn(className)}
      initial={{
        opacity: 1,
        y: motionY,
        x,
        scale: scale === 1 ? 1 : scale,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
      }}
      viewport={{ once, margin: "0px 0px -6% 0px", amount: 0.05 }}
      transition={{ ...snapInTransition, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function RevealText({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      variants={snapStaggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -6% 0px", amount: 0.05 }}
      transition={{ delayChildren: delay }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div className={cn(className)} variants={snapStaggerItem}>
      {children}
    </motion.div>
  );
}

export function Float({
  children,
  className,
  duration = 6,
  distance = 8,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  distance?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      animate={{ y: [0, -distance, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

export function HoverLift({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      {children}
    </motion.div>
  );
}

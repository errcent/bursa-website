"use client";

import Image from "next/image";
import { useEffect, type RefObject } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

type WaitlistTextureLayerProps = {
  sectionRef: RefObject<HTMLElement | null>;
};

export function WaitlistTextureLayer({ sectionRef }: WaitlistTextureLayerProps) {
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const textureOpacity = useTransform(
    scrollYProgress,
    [0, 0.22, 0.45, 0.68, 1],
    [0, 0.36, 0.48, 0.36, 0]
  );
  const scrollShift = useTransform(scrollYProgress, [0, 1], [2.6, -2.6]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 80, damping: 22, mass: 0.55 });
  const smoothY = useSpring(mouseY, { stiffness: 80, damping: 22, mass: 0.55 });

  const x = useMotionTemplate`${smoothX}px`;
  const y = useMotionTemplate`calc(${scrollShift}vh + ${smoothY}px)`;

  useEffect(() => {
    if (reduceMotion) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (event: PointerEvent) => {
      const nx = event.clientX / window.innerWidth;
      const ny = event.clientY / window.innerHeight;
      const rightWeight = nx > 0.5 ? (nx - 0.5) * 2 : 0;
      mouseX.set((nx - 0.5) * rightWeight * 36);
      mouseY.set((ny - 0.5) * (0.2 + rightWeight * 0.55) * 22);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mouseX, mouseY, reduceMotion]);

  return (
    <motion.div
      className="landing-accent-run__texture"
      style={
        reduceMotion
          ? { opacity: textureOpacity }
          : { opacity: textureOpacity, x, y, scale: 1.05 }
      }
      aria-hidden
    >
      <Image
        src="/images/landing/waitlist-feather-texture-4k-low.jpg"
        alt=""
        fill
        sizes="100vw"
        quality={90}
        className="landing-accent-run__texture-img"
      />
    </motion.div>
  );
}

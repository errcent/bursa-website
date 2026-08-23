"use client";

import {
  cloneElement,
  isValidElement,
  useId,
  useRef,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import { WaitlistTextureLayer } from "@/components/home/waitlist-texture-layer";

type WaitlistElement = ReactElement<{
  pinRef?: Ref<HTMLDivElement | null>;
  sectionRef?: Ref<HTMLElement | null>;
}>;

export function LandingAccentRun({
  pin,
  waitlist,
  children,
}: {
  pin: ReactNode;
  waitlist: WaitlistElement;
  children: ReactNode;
}) {
  const mockupPinRef = useRef<HTMLDivElement>(null);
  const waitlistPinRef = useRef<HTMLDivElement>(null);
  const waitlistSectionRef = useRef<HTMLElement>(null);
  const grainId = useId().replace(/:/g, "");
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: mockupPinRef,
    offset: ["start start", "end end"],
  });

  const riseY = useTransform(
    scrollYProgress,
    [0, 0.4, 0.52, 0.7, 0.88, 1],
    ["40%", "40%", "20%", "2%", "-22%", "-42%"]
  );
  const canvasTint = useTransform(
    scrollYProgress,
    [0, 0.4, 0.52, 0.7, 0.88, 1],
    [0, 0, 8, 18, 28, 32]
  );
  const grainOpacity = useTransform(scrollYProgress, [0, 0.4, 1], [0.06, 0.06, 0.18]);
  const ovalOpacity = useTransform(scrollYProgress, [0, 0.4, 0.62, 1], [0, 0, 0.26, 0.34]);
  const runBg = useMotionTemplate`color-mix(in srgb, var(--hero-accent) ${canvasTint}%, var(--section-canvas))`;

  const waitlistNode = isValidElement(waitlist)
    ? cloneElement(waitlist, {
        pinRef: waitlistPinRef,
        sectionRef: waitlistSectionRef,
      })
    : waitlist;

  return (
    <motion.div
      className="landing-accent-run"
      style={
        reduceMotion
          ? {
              backgroundColor:
                "color-mix(in srgb, var(--hero-accent) 32%, var(--section-canvas))",
            }
          : { backgroundColor: runBg }
      }
    >
      <div
        className={
          reduceMotion
            ? "landing-accent-run__wash landing-accent-run__wash--static"
            : "landing-accent-run__wash"
        }
        aria-hidden
      >
        {reduceMotion ? (
          <div className="landing-accent-run__rise-fill" />
        ) : (
          <motion.div className="landing-accent-run__rise" style={{ y: riseY }}>
            <div className="landing-accent-run__rise-fill" />
          </motion.div>
        )}
        <WaitlistTextureLayer sectionRef={waitlistSectionRef} leadProgress={scrollYProgress} />
        <motion.span
          className="landing-accent-run__oval"
          style={{ opacity: reduceMotion ? 0.34 : ovalOpacity }}
        />
        {!reduceMotion ? (
          <motion.svg className="device-mockup-wash-grain" style={{ opacity: grainOpacity }}>
            <filter id={grainId}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.8"
                numOctaves="3"
                stitchTiles="stitch"
              />
              <feComponentTransfer>
                <feFuncA type="table" tableValues="0 1" />
              </feComponentTransfer>
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter={`url(#${grainId})`} />
          </motion.svg>
        ) : null}
      </div>

      <div ref={mockupPinRef} className="landing-accent-run__pin">{pin}</div>
      {waitlistNode}
      {children}
    </motion.div>
  );
}

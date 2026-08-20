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

type WaitlistElement = ReactElement<{ pinRef?: Ref<HTMLDivElement | null> }>;

export function LandingAccentRun({
  pin,
  waitlist,
  children,
}: {
  pin: ReactNode;
  waitlist: WaitlistElement;
  children: ReactNode;
}) {
  const waitlistPinRef = useRef<HTMLDivElement>(null);
  const grainId = useId().replace(/:/g, "");
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: waitlistPinRef,
    offset: ["start end", "center center"],
  });

  const riseY = useTransform(
    scrollYProgress,
    [0, 0.18, 0.38, 0.58, 0.8, 1],
    ["40%", "24%", "8%", "-8%", "-28%", "-48%"]
  );
  const canvasTint = useTransform(
    scrollYProgress,
    [0, 0.18, 0.38, 0.58, 0.8, 1],
    [0, 3, 8, 15, 24, 32]
  );
  const grainOpacity = useTransform(scrollYProgress, [0, 1], [0.015, 0.06]);
  const runBg = useMotionTemplate`color-mix(in srgb, var(--hero-accent) ${canvasTint}%, var(--section-canvas))`;

  const waitlistNode = isValidElement(waitlist)
    ? cloneElement(waitlist, { pinRef: waitlistPinRef })
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
      {!reduceMotion ? (
        <div className="landing-accent-run__wash" aria-hidden>
          <span className="landing-accent-run__oval" />
          <motion.div className="landing-accent-run__rise" style={{ y: riseY }}>
            <div className="landing-accent-run__rise-fill" />
          </motion.div>
          <motion.svg className="device-mockup-wash-grain" style={{ opacity: grainOpacity }}>
            <filter id={grainId}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.8"
                numOctaves="3"
                stitchTiles="stitch"
              />
              <feComponentTransfer>
                <feFuncA type="table" tableValues="0 0.85" />
              </feComponentTransfer>
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter={`url(#${grainId})`} />
          </motion.svg>
        </div>
      ) : (
        <div className="landing-accent-run__wash landing-accent-run__wash--static" aria-hidden>
          <span className="landing-accent-run__oval" />
          <div className="landing-accent-run__rise-fill" />
        </div>
      )}

      <div className="landing-accent-run__pin">{pin}</div>
      {waitlistNode}
      {children}
    </motion.div>
  );
}

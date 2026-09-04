"use client";

import { useEffect, useLayoutEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

import { LandingStoryCursor } from "@/components/home/landing-story-cursor";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { WordReveal } from "@/components/motion/word-reveal";

const PROBLEMS = [
  "Belum menemukan mentor atau pembelajaran yang tepat",
  "Materi yang tidak sesuai dengan profil risikomu",
  "Jutaan video, tanpa tahu harus menonton yang mana",
] as const;

const SOLUTIONS = [
  { key: "Tepat", line: "sesuai profil risiko dan cara belajarmu" },
  { key: "Terpilih", line: "materi dikurasi, bukan ditumpuk" },
  { key: "Runut", line: "kamu tahu langkah berikutnya" },
] as const;

const COPY = {
  headline: "Yang kamu butuhkan adalah kepastian.",
  lede: "Banyak yang belajar trading dan investasi tersesat bukan karena kurang materi. Mereka belum menemukan jalur yang sesuai.",
  turn: "Yang kamu dapatkan",
  close: "Kamu tahu harus mulai dari mana.",
} as const;

const STORY_LIFT_QUERY = "(max-width: 768px), (pointer: coarse)";

function subscribeSkipStoryLift(onChange: () => void) {
  const media = window.matchMedia(STORY_LIFT_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSkipStoryLift() {
  return window.matchMedia(STORY_LIFT_QUERY).matches;
}

/**
 * Hysteresis so rubber-band scroll near a threshold cannot flap acts.
 * Fast jumps still land on act 1 when crossing the mid band (never skip 02).
 */
function resolveLockedAct(value: number, prev: number) {
  if (prev === 0) {
    if (value < 0.16) return 0;
    if (value < 0.62) return 1;
    return 2;
  }
  if (prev === 1) {
    if (value < 0.13) return 0;
    if (value >= 0.64) return 2;
    return 1;
  }
  if (value < 0.58) return value < 0.13 ? 0 : 1;
  return 2;
}

function resolveLockedLines(value: number, prev: number, act: number) {
  // Act 02 must never look empty: at least the first problem line is on.
  if (act === 1 && prev < 1) return Math.max(1, prev);

  if (prev <= 0) return value >= 0.19 ? (value >= 0.35 ? (value >= 0.49 ? 3 : 2) : 1) : 0;
  if (prev === 1) {
    if (act === 1 && value < 0.17) return 1;
    if (value < 0.17) return 0;
    if (value >= 0.35) return value >= 0.49 ? 3 : 2;
    return 1;
  }
  if (prev === 2) {
    if (value < 0.33) return value < 0.17 ? (act === 1 ? 1 : 0) : 1;
    if (value >= 0.49) return 3;
    return 2;
  }
  if (value < 0.47) return value < 0.33 ? (value < 0.17 ? (act === 1 ? 1 : 0) : 1) : 2;
  return 3;
}

function resolveLockedStrikes(value: number, prev: number) {
  if (prev <= 0) return value >= 0.3 ? (value >= 0.45 ? (value >= 0.57 ? 3 : 2) : 1) : 0;
  if (prev === 1) {
    if (value < 0.27) return 0;
    if (value >= 0.45) return value >= 0.57 ? 3 : 2;
    return 1;
  }
  if (prev === 2) {
    if (value < 0.42) return value < 0.27 ? 0 : 1;
    if (value >= 0.57) return 3;
    return 2;
  }
  if (value < 0.54) return value < 0.42 ? (value < 0.27 ? 0 : 1) : 2;
  return 3;
}

function StoryProblem({
  text,
  opacity,
  strike,
  mute,
}: {
  text: string;
  opacity: MotionValue<number>;
  strike: MotionValue<number>;
  mute: MotionValue<number>;
}) {
  const strikeSize = useTransform(strike, (value) => `${Math.min(1, Math.max(0, value)) * 100}% 1.2px`);
  const textColor = useTransform(
    mute,
    (value) => `color-mix(in srgb, var(--foreground) ${Math.min(1, Math.max(0, value)) * 100}%, transparent)`
  );

  return (
    <motion.p className="home-story__problem" style={{ opacity }}>
      <motion.span
        className="home-story__problem-text"
        style={{ color: textColor, backgroundSize: strikeSize }}
      >
        {text}
      </motion.span>
    </motion.p>
  );
}

function StorySolution({
  step,
  opacity,
}: {
  step: (typeof SOLUTIONS)[number];
  opacity: MotionValue<number>;
}) {
  return (
    <motion.p className="home-story__step" style={{ opacity }}>
      <span className="home-story__key">{step.key}</span>
      <span className="home-story__line">{step.line}</span>
    </motion.p>
  );
}

function StoryAct({
  className,
  opacity,
  children,
}: {
  className: string;
  opacity: MotionValue<number>;
  children: React.ReactNode;
}) {
  const visibility = useTransform(opacity, (value) => (value <= 0.04 ? "hidden" : "visible"));

  return (
    <motion.div className={className} style={{ opacity, visibility }}>
      <div className="home-story-act__inner">{children}</div>
    </motion.div>
  );
}

function StoryStatic() {
  return (
    <section id="landasan" className="section-cinematic-dark scroll-mt-24">
      <div className="container-page relative z-[2]">
        <div className="home-protocol">
          <div className="home-protocol__lead">
            <WordReveal
              as="h2"
              className="section-display-title"
              text={COPY.headline}
              trigger="inView"
              delay={0.04}
            />
            <Reveal delay={0.1}>
              <p className="section-copy mt-5 max-w-md">{COPY.lede}</p>
            </Reveal>
          </div>

          <div className="home-protocol__sheet">
            <Stagger className="home-protocol__refusals" delay={0.05}>
              {PROBLEMS.map((item) => (
                <StaggerItem key={item}>
                  <p className="home-protocol__refuse">{item}</p>
                </StaggerItem>
              ))}
            </Stagger>

            <p className="home-protocol__turn">{COPY.turn}</p>

            <Stagger className="home-protocol__steps" delay={0.08}>
              {SOLUTIONS.map((step) => (
                <StaggerItem key={step.key}>
                  <p className="home-protocol__step">
                    <span className="home-protocol__key">{step.key}</span>
                    <span className="home-protocol__line">{step.line}</span>
                  </p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </div>
    </section>
  );
}

function StorySrOnly() {
  return (
    <div className="sr-only">
      <h2 id="landasan-heading">{COPY.headline}</h2>
      <p>{COPY.lede}</p>
      <ul>
        {PROBLEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>{COPY.turn}</p>
      <ul>
        {SOLUTIONS.map((step) => (
          <li key={step.key}>
            {step.key} {step.line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function syncProblemLines(
  nodes: (HTMLParagraphElement | null)[],
  lines: number,
  strikes: number
) {
  nodes.forEach((node, index) => {
    node?.classList.toggle("is-on", lines > index);
    node?.classList.toggle("is-struck", strikes > index);
  });
}

/** Lock pin height to px on mount so iOS chrome resize does not shrink/grow the stage. */
function useFrozenStoryPinHeight(trackRef: RefObject<HTMLElement | null>) {
  const pinHRef = useRef(0);

  useLayoutEffect(() => {
    const apply = () => {
      const track = trackRef.current;
      if (!track) return;
      const pinH = Math.max(320, Math.round(window.innerHeight));
      pinHRef.current = pinH;
      track.style.setProperty("--story-pin-h", `${pinH}px`);
    };

    apply();
    window.addEventListener("orientationchange", apply);
    return () => window.removeEventListener("orientationchange", apply);
  }, [trackRef]);

  return pinHRef;
}

/**
 * iOS sticky compositor jitter: pin with absolute/fixed/absolute.
 * Pin min-height already reserves scroll room — no spacer toggle (that made Discover jump).
 * Hysteresis stops fixed↔released thrash at the overlap with Discover.
 */
function useMobileStoryPin(
  trackRef: RefObject<HTMLElement | null>,
  stickyRef: RefObject<HTMLDivElement | null>,
  pinHRef: RefObject<number>
) {
  useEffect(() => {
    const modeRef = { current: "start" as "start" | "fixed" | "released" };
    const EDGE = 28;

    const sync = () => {
      const track = trackRef.current;
      const sticky = stickyRef.current;
      if (!track || !sticky) return;

      const pinH = pinHRef.current || Math.max(320, Math.round(window.innerHeight));
      const { top: trackTop, bottom: trackBottom } = track.getBoundingClientRect();
      const prev = modeRef.current;
      let next = prev;

      if (prev === "start") {
        if (trackTop <= -EDGE) next = "fixed";
      } else if (prev === "fixed") {
        if (trackTop > EDGE) next = "start";
        else if (trackBottom <= pinH - EDGE) next = "released";
      } else if (trackBottom > pinH + EDGE) {
        next = "fixed";
      }

      if (next === prev) return;
      modeRef.current = next;
      sticky.classList.toggle("is-pin-fixed", next === "fixed");
      sticky.classList.toggle("is-pin-released", next === "released");
    };

    let rafId = 0;
    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        sync();
      });
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
    };
  }, [trackRef, stickyRef, pinHRef]);
}

/** Mobile/coarse: sticky stage, threshold classes via DOM (no React setState per scroll). */
function LockedStory() {
  const trackRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const problemsRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);
  const problemLineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const actRef = useRef(0);
  const linesRef = useRef(0);
  const strikesRef = useRef(0);

  const pinHRef = useFrozenStoryPinHeight(trackRef);
  useMobileStoryPin(trackRef, stickyRef, pinHRef);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    introRef.current?.classList.add("is-on");
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const nextAct = resolveLockedAct(value, actRef.current);
    let nextLines = resolveLockedLines(value, linesRef.current, nextAct);
    if (nextAct === 1) nextLines = Math.max(1, nextLines);
    if (nextAct !== 1) nextLines = nextAct === 0 ? 0 : 3;
    const nextStrikes =
      nextAct === 1 ? resolveLockedStrikes(value, strikesRef.current) : nextAct === 2 ? 3 : 0;

    if (actRef.current !== nextAct) {
      actRef.current = nextAct;
      introRef.current?.classList.toggle("is-on", nextAct === 0);
      problemsRef.current?.classList.toggle("is-on", nextAct === 1);
      solutionRef.current?.classList.toggle("is-on", nextAct === 2);
    }

    if (linesRef.current !== nextLines || strikesRef.current !== nextStrikes) {
      linesRef.current = nextLines;
      strikesRef.current = nextStrikes;
      syncProblemLines(problemLineRefs.current, nextLines, nextStrikes);
    }
  });

  return (
    <section
      ref={trackRef}
      id="landasan"
      className="home-story-track scroll-mt-24"
      aria-labelledby="landasan-heading"
    >
      <StorySrOnly />
      <div className="home-story-pin">
        <div ref={stickyRef} className="home-story-sticky home-story-sticky--locked" aria-hidden>
          <div className="home-story-stage container-page">
            <div className="home-story-frame">
              <div ref={introRef} className="home-story-intro">
                <div className="home-story-act__inner">
                  <p className="home-story-folio">01</p>
                  <p className="home-story-headline section-display-title">{COPY.headline}</p>
                  <p className="section-copy home-story-lede">{COPY.lede}</p>
                </div>
              </div>

              <div ref={problemsRef} className="home-story-problems">
                <div className="home-story-act__inner">
                  <p className="home-story-folio">02</p>
                  {PROBLEMS.map((text, index) => (
                    <p
                      key={text}
                      ref={(node) => {
                        problemLineRefs.current[index] = node;
                      }}
                      className="home-story__problem"
                    >
                      <span className="home-story__problem-text">{text}</span>
                    </p>
                  ))}
                </div>
              </div>

              <div ref={solutionRef} className="home-story-solution home-story-solution--stay">
                <div className="home-story-act__inner">
                  <p className="home-story-folio">03</p>
                  <p className="home-story-turn">{COPY.turn}</p>
                  <p className="home-story-headline section-display-title">{COPY.close}</p>
                  <div className="home-story-steps">
                    {SOLUTIONS.map((step) => (
                      <p key={step.key} className="home-story__step">
                        <span className="home-story__key">{step.key}</span>
                        <span className="home-story__line">{step.line}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DesktopStory() {
  const trackRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const introOpacity = useTransform(scrollYProgress, [0, 0.12, 0.145], [1, 1, 0]);

  const problemStageOpacity = useTransform(
    scrollYProgress,
    [0.16, 0.185, 0.575, 0.6],
    [0, 1, 1, 0]
  );

  const p1Opacity = useTransform(scrollYProgress, [0.16, 0.185, 0.575, 0.6], [0, 1, 1, 0]);
  const p1Strike = useTransform(scrollYProgress, [0.27, 0.29], [0, 1]);
  const p1Mute = useTransform(scrollYProgress, [0.27, 0.29], [1, 0.48]);

  const p2Opacity = useTransform(scrollYProgress, [0.32, 0.345, 0.575, 0.6], [0, 1, 1, 0]);
  const p2Strike = useTransform(scrollYProgress, [0.42, 0.44], [0, 1]);
  const p2Mute = useTransform(scrollYProgress, [0.42, 0.44], [1, 0.48]);

  const p3Opacity = useTransform(scrollYProgress, [0.46, 0.485, 0.575, 0.6], [0, 1, 1, 0]);
  const p3Strike = useTransform(scrollYProgress, [0.54, 0.56], [0, 1]);
  const p3Mute = useTransform(scrollYProgress, [0.54, 0.56], [1, 0.48]);

  const solutionOpacity = useTransform(scrollYProgress, [0, 0.6, 0.66, 1], [0, 0, 1, 1]);
  const cursorProgress = useTransform(scrollYProgress, [0, 0.66], [0, 1]);

  const s1Opacity = useTransform(scrollYProgress, [0, 0.64, 0.68, 1], [0, 0, 1, 1]);
  const s2Opacity = useTransform(scrollYProgress, [0, 0.67, 0.705, 1], [0, 0, 1, 1]);
  const s3Opacity = useTransform(scrollYProgress, [0, 0.7, 0.735, 1], [0, 0, 1, 1]);

  return (
    <section
      ref={trackRef}
      id="landasan"
      className="home-story-track scroll-mt-24"
      aria-labelledby="landasan-heading"
    >
      <StorySrOnly />
      <LandingStoryCursor progress={cursorProgress} />
      <div className="home-story-pin">
        <div className="home-story-sticky" aria-hidden>
          <div className="home-story-stage container-page">
            <div className="home-story-frame">
              <StoryAct className="home-story-intro" opacity={introOpacity}>
                <p className="home-story-folio">01</p>
                <p className="home-story-headline section-display-title">{COPY.headline}</p>
                <p className="section-copy home-story-lede">{COPY.lede}</p>
              </StoryAct>

              <StoryAct className="home-story-problems" opacity={problemStageOpacity}>
                <p className="home-story-folio">02</p>
                <StoryProblem
                  text={PROBLEMS[0]}
                  opacity={p1Opacity}
                  strike={p1Strike}
                  mute={p1Mute}
                />
                <StoryProblem
                  text={PROBLEMS[1]}
                  opacity={p2Opacity}
                  strike={p2Strike}
                  mute={p2Mute}
                />
                <StoryProblem
                  text={PROBLEMS[2]}
                  opacity={p3Opacity}
                  strike={p3Strike}
                  mute={p3Mute}
                />
              </StoryAct>

              <motion.div
                className="home-story-solution home-story-solution--stay"
                style={{ opacity: solutionOpacity }}
              >
                <div className="home-story-act__inner">
                  <p className="home-story-folio">03</p>
                  <p className="home-story-turn">{COPY.turn}</p>
                  <p className="home-story-headline section-display-title">{COPY.close}</p>
                  <div className="home-story-steps">
                    <StorySolution step={SOLUTIONS[0]} opacity={s1Opacity} />
                    <StorySolution step={SOLUTIONS[1]} opacity={s2Opacity} />
                    <StorySolution step={SOLUTIONS[2]} opacity={s3Opacity} />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeProblemSection() {
  const reduceMotion = useReducedMotion();
  const skipLift = useSyncExternalStore(subscribeSkipStoryLift, getSkipStoryLift, () => false);

  if (reduceMotion) return <StoryStatic />;
  if (skipLift) return <LockedStory />;
  return <DesktopStory />;
}

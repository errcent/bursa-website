"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

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
  lede: "Banyak trader tersesat bukan karena kurang belajar. Mereka belum menemukan jalur yang sesuai.",
  turn: "Yang kamu dapatkan",
  close: "Kamu tahu harus mulai dari mana.",
} as const;

function StoryProblem({
  text,
  opacity,
  y,
  strike,
  mute,
}: {
  text: string;
  opacity: MotionValue<number>;
  y: MotionValue<number>;
  strike: MotionValue<number>;
  mute: MotionValue<number>;
}) {
  return (
    <motion.p className="home-story__problem" style={{ opacity, y }}>
      <motion.span className="home-story__problem-text" style={{ opacity: mute }}>
        {text}
      </motion.span>
      <motion.span className="home-story__strike" style={{ scaleX: strike }} aria-hidden />
    </motion.p>
  );
}

function StorySolution({
  step,
  opacity,
  y,
}: {
  step: (typeof SOLUTIONS)[number];
  opacity: MotionValue<number>;
  y: MotionValue<number>;
}) {
  return (
    <motion.p className="home-story__step" style={{ opacity, y }}>
      <span className="home-story__key">{step.key}</span>
      <span className="home-story__line">{step.line}</span>
    </motion.p>
  );
}

function StoryAct({
  className,
  opacity,
  y,
  children,
}: {
  className: string;
  opacity: MotionValue<number>;
  y?: MotionValue<number>;
  children: React.ReactNode;
}) {
  const visibility = useTransform(opacity, (value) => (value <= 0.04 ? "hidden" : "visible"));

  return (
    <motion.div className={className} style={{ opacity, visibility }}>
      <motion.div className="home-story-act__inner" style={y ? { y } : undefined}>
        {children}
      </motion.div>
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

export function HomeProblemSection() {
  const trackRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const introOpacity = useTransform(scrollYProgress, [0, 0.12, 0.145], [1, 1, 0]);
  const introY = useTransform(scrollYProgress, [0, 0.12, 0.145], [0, 0, -12]);

  const problemStageOpacity = useTransform(
    scrollYProgress,
    [0.16, 0.185, 0.575, 0.6],
    [0, 1, 1, 0]
  );

  const p1Opacity = useTransform(scrollYProgress, [0.16, 0.185, 0.575, 0.6], [0, 1, 1, 0]);
  const p1Y = useTransform(scrollYProgress, [0.16, 0.185], [12, 0]);
  const p1Strike = useTransform(scrollYProgress, [0.27, 0.29], [0, 1]);
  const p1Mute = useTransform(scrollYProgress, [0.27, 0.29], [1, 0.48]);

  const p2Opacity = useTransform(scrollYProgress, [0.32, 0.345, 0.575, 0.6], [0, 1, 1, 0]);
  const p2Y = useTransform(scrollYProgress, [0.32, 0.345], [12, 0]);
  const p2Strike = useTransform(scrollYProgress, [0.42, 0.44], [0, 1]);
  const p2Mute = useTransform(scrollYProgress, [0.42, 0.44], [1, 0.48]);

  const p3Opacity = useTransform(scrollYProgress, [0.46, 0.485, 0.575, 0.6], [0, 1, 1, 0]);
  const p3Y = useTransform(scrollYProgress, [0.46, 0.485], [12, 0]);
  const p3Strike = useTransform(scrollYProgress, [0.54, 0.56], [0, 1]);
  const p3Mute = useTransform(scrollYProgress, [0.54, 0.56], [1, 0.48]);

  const solutionOpacity = useTransform(scrollYProgress, [0, 0.6, 0.66, 1], [0, 0, 1, 1]);
  const solutionY = useTransform(scrollYProgress, [0.6, 0.66], [12, 0]);

  const s1Opacity = useTransform(scrollYProgress, [0, 0.64, 0.68, 1], [0, 0, 1, 1]);
  const s1Y = useTransform(scrollYProgress, [0.64, 0.68], [10, 0]);
  const s2Opacity = useTransform(scrollYProgress, [0, 0.67, 0.705, 1], [0, 0, 1, 1]);
  const s2Y = useTransform(scrollYProgress, [0.67, 0.705], [10, 0]);
  const s3Opacity = useTransform(scrollYProgress, [0, 0.7, 0.735, 1], [0, 0, 1, 1]);
  const s3Y = useTransform(scrollYProgress, [0.7, 0.735], [10, 0]);

  if (reduceMotion) {
    return <StoryStatic />;
  }

  return (
    <section
      ref={trackRef}
      id="landasan"
      className="home-story-track scroll-mt-24"
      aria-labelledby="landasan-heading"
    >
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

      <div className="home-story-pin">
      <div className="home-story-sticky" aria-hidden>
        <div className="home-story-stage container-page">
          <div className="home-story-frame">
            <StoryAct className="home-story-intro" opacity={introOpacity} y={introY}>
              <p className="home-story-folio">01</p>
              <p className="home-story-headline section-display-title">
                {COPY.headline}
              </p>
              <p className="section-copy home-story-lede">{COPY.lede}</p>
            </StoryAct>

            <StoryAct className="home-story-problems" opacity={problemStageOpacity}>
              <p className="home-story-folio">02</p>
              <StoryProblem
                text={PROBLEMS[0]}
                opacity={p1Opacity}
                y={p1Y}
                strike={p1Strike}
                mute={p1Mute}
              />
              <StoryProblem
                text={PROBLEMS[1]}
                opacity={p2Opacity}
                y={p2Y}
                strike={p2Strike}
                mute={p2Mute}
              />
              <StoryProblem
                text={PROBLEMS[2]}
                opacity={p3Opacity}
                y={p3Y}
                strike={p3Strike}
                mute={p3Mute}
              />
            </StoryAct>

            <motion.div
              className="home-story-solution home-story-solution--stay"
              style={{ opacity: solutionOpacity }}
            >
              <motion.div className="home-story-act__inner" style={{ y: solutionY }}>
                <p className="home-story-folio">03</p>
                <p className="home-story-turn">{COPY.turn}</p>
                <p className="home-story-headline section-display-title">
                  {COPY.close}
                </p>
                <div className="home-story-steps">
                  <StorySolution step={SOLUTIONS[0]} opacity={s1Opacity} y={s1Y} />
                  <StorySolution step={SOLUTIONS[1]} opacity={s2Opacity} y={s2Y} />
                  <StorySolution step={SOLUTIONS[2]} opacity={s3Opacity} y={s3Y} />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}

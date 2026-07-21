"use client";

import { Fragment, type ReactNode, type Ref, useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type Variants,
  type ViewportOptions,
} from "motion/react";

import { cn } from "@/lib/utils";

export const WORD_REVEAL_EASE = [0.22, 1, 0.36, 1] as const;
export const WORD_REVEAL_STAGGER = 0.09;
export const WORD_REVEAL_DURATION = 0.5;

/** Atom AI hero presets — headline: y10/blur10; body copy: y5/blur2. */
export const WORD_REVEAL_PRESETS = {
  headline: { y: 10, blur: 10 },
  body: { y: 5, blur: 2 },
  default: { y: 8, blur: 6 },
} as const;

export type WordRevealIntensity = keyof typeof WORD_REVEAL_PRESETS;

type WordSegment = {
  text: string;
  className?: string;
};

export type WordRevealProps = {
  text?: string;
  segments?: WordSegment[];
  className?: string;
  /** Applied to each word span — use for `text-gradient` so clip + opacity stay on the same node. */
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  trigger?: "immediate" | "inView";
  viewport?: ViewportOptions;
  once?: boolean;
  intensity?: WordRevealIntensity;
  "aria-label"?: string;
};

type ContainerConfig = {
  delay: number;
  stagger: number;
};

const motionComponents = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
} as const;

const DEFAULT_VIEWPORT: ViewportOptions = {
  once: true,
  margin: "0px 0px -5% 0px",
  amount: 0.15,
};

const containerVariants: Variants = {
  hidden: {},
  show: ({ delay, stagger }: ContainerConfig) => ({
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  }),
};

function wordVariantsForIntensity(intensity: WordRevealIntensity): Variants {
  const { y, blur } = WORD_REVEAL_PRESETS[intensity];
  return {
    hidden: {
      opacity: 0,
      y,
      filter: `blur(${blur}px)`,
    },
    show: (unitDuration: number) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: unitDuration, ease: WORD_REVEAL_EASE },
    }),
  };
}

/** Split on whitespace; hyphenated compounds stay one reveal unit (e.g. Diam-Diam). */
export function tokenizeForReveal(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function resolveSegments(text?: string, segments?: WordSegment[]): WordSegment[] {
  if (segments?.length) return segments;
  if (!text) return [];
  return tokenizeForReveal(text).map((token) => ({ text: token }));
}

function segmentsToPlainText(segments: WordSegment[]): string {
  return segments.map((segment) => segment.text).join(" ");
}

function wordRevealFailsafeMs(
  wordCount: number,
  delay: number,
  stagger: number,
  duration: number
): number {
  if (wordCount <= 0) return (delay + 0.5) * 1000;
  return (delay + (wordCount - 1) * stagger + duration + 0.5) * 1000;
}

/** Transparent full text — receives selection/copy while animated words stay visual-only. */
function CopySelectionLayer({ text }: { text: string }) {
  return (
    <span
      className="absolute inset-0 z-0 select-text whitespace-pre-wrap text-transparent"
      aria-hidden="true"
    >
      {text}
    </span>
  );
}

function VisualWordLayer({
  children,
  hideFromAccessibility,
}: {
  children: ReactNode;
  hideFromAccessibility: boolean;
}) {
  return (
    <span
      className="relative z-[1] inline select-none pointer-events-none"
      aria-hidden={hideFromAccessibility ? true : undefined}
    >
      {children}
    </span>
  );
}

function WordSpace() {
  return <span className="inline"> </span>;
}

function renderStaticWords(
  words: WordSegment[],
  wordClassName?: string,
  isSemanticHeading = false
) {
  return words.map((word, index) => (
    <Fragment key={`${word.text}-${index}`}>
      <span
        className={cn("inline-block", wordClassName, word.className)}
        aria-hidden={isSemanticHeading ? true : undefined}
      >
        {word.text}
      </span>
      {index < words.length - 1 ? <WordSpace /> : null}
    </Fragment>
  ));
}

function renderAnimatedWords(
  words: WordSegment[],
  wordClassName: string | undefined,
  duration: number,
  intensity: WordRevealIntensity,
  isSemanticHeading: boolean
) {
  const variants = wordVariantsForIntensity(intensity);
  return words.map((word, index) => (
    <Fragment key={`${word.text}-${index}`}>
      <motion.span
        className={cn("inline-block", wordClassName, word.className)}
        variants={variants}
        custom={duration}
        aria-hidden={isSemanticHeading ? true : undefined}
      >
        {word.text}
      </motion.span>
      {index < words.length - 1 ? <WordSpace /> : null}
    </Fragment>
  ));
}

export function WordReveal({
  text,
  segments,
  className,
  wordClassName,
  delay = 0,
  stagger = WORD_REVEAL_STAGGER,
  duration = WORD_REVEAL_DURATION,
  as: Component = "span",
  trigger = "immediate",
  viewport = DEFAULT_VIEWPORT,
  once = true,
  intensity = "default",
  "aria-label": ariaLabel,
}: WordRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, {
    once: viewport.once ?? once,
    margin: (viewport.margin ?? DEFAULT_VIEWPORT.margin) as `${number}px ${number}px ${number}px ${number}px`,
    amount: viewport.amount ?? DEFAULT_VIEWPORT.amount,
  });
  const words = resolveSegments(text, segments);
  const plainText = text ?? segmentsToPlainText(words);
  const accessibleLabel = ariaLabel ?? plainText;
  const MotionComponent = motionComponents[Component];
  const isSemanticHeading = Component !== "span" && Component !== "p";
  const animationDoneRef = useRef(false);
  const [useFallback, setUseFallback] = useState(false);

  const shouldReveal = trigger === "immediate" || isInView;

  useEffect(() => {
    if (prefersReducedMotion || !shouldReveal) return;

    animationDoneRef.current = false;
    setUseFallback(false);

    const failsafeMs = wordRevealFailsafeMs(words.length, delay, stagger, duration);
    const id = window.setTimeout(() => {
      if (!animationDoneRef.current) setUseFallback(true);
    }, failsafeMs);

    return () => window.clearTimeout(id);
  }, [
    delay,
    duration,
    prefersReducedMotion,
    shouldReveal,
    stagger,
    text,
    segments,
    words.length,
  ]);

  if (prefersReducedMotion || useFallback) {
    return (
      <Component
        className={cn(className, "relative")}
        aria-label={accessibleLabel}
      >
        <CopySelectionLayer text={plainText} />
        <VisualWordLayer hideFromAccessibility={isSemanticHeading}>
          {renderStaticWords(words, wordClassName, isSemanticHeading)}
        </VisualWordLayer>
      </Component>
    );
  }

  return (
    <MotionComponent
      ref={containerRef as Ref<HTMLHeadingElement>}
      className={cn(className, "relative")}
      aria-label={isSemanticHeading ? accessibleLabel : ariaLabel}
    >
      <CopySelectionLayer text={plainText} />
      <motion.span
        className="relative z-[1] inline select-none pointer-events-none"
        aria-hidden={isSemanticHeading ? true : undefined}
        initial="hidden"
        animate={shouldReveal ? "show" : "hidden"}
        custom={{ delay, stagger }}
        variants={containerVariants}
        onAnimationComplete={(definition) => {
          if (definition === "show") animationDoneRef.current = true;
        }}
      >
        {renderAnimatedWords(words, wordClassName, duration, intensity, isSemanticHeading)}
      </motion.span>
    </MotionComponent>
  );
}

/** Seconds until the last word finishes its reveal animation. */
export function wordRevealTotalDuration(
  textOrWordCount: string | number,
  {
    delay = 0,
    stagger = WORD_REVEAL_STAGGER,
    duration = WORD_REVEAL_DURATION,
  }: {
    delay?: number;
    stagger?: number;
    duration?: number;
  } = {}
): number {
  const wordCount =
    typeof textOrWordCount === "number"
      ? textOrWordCount
      : tokenizeForReveal(textOrWordCount).length;

  if (wordCount <= 0) return delay;
  return delay + (wordCount - 1) * stagger + duration;
}

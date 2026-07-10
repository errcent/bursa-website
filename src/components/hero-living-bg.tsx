"use client";

import { useEffect, useId, useMemo, useState } from "react";

const ATOM_HORIZON_PATH =
  "M0 76.75 C31.2 66.07 61 52.37 92.7 42.97 C114.9 36.38 136.3 29.04 159.9 29.04 C200.2 29.04 231.3 59.9 269.8 68.19 C276.7 69.65 288.6 71.7 294.7 67.37 C305 59.95 312.4 49.36 322.9 41.95 C340.4 29.61 358.8 23.04 379.9 29.52 C385.1 31.11 391.9 30.92 396.2 27.55 C403.1 22.05 407 14.19 411.4 6.89 C412.7 4.67 414.8 3.53 416 0.9";

function HorizonSvg({ gradientId, className }: { gradientId: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 832 78"
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(163, 163, 163, 0)" />
          <stop offset="25%" stopColor="rgba(163, 163, 163, 0.12)" />
          <stop offset="50%" stopColor="rgba(229, 229, 229, 0.1)" />
          <stop offset="75%" stopColor="rgba(163, 163, 163, 0.1)" />
          <stop offset="100%" stopColor="rgba(163, 163, 163, 0)" />
        </linearGradient>
        <filter id={`${gradientId}-glow`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={`${ATOM_HORIZON_PATH} L832 78 L0 78 Z`}
        fill={`url(#${gradientId})`}
        opacity="0.38"
      />
      <path
        d={ATOM_HORIZON_PATH}
        fill="none"
        stroke="rgba(163, 163, 163, 0.28)"
        strokeWidth="1.5"
        strokeLinecap="round"
        filter={`url(#${gradientId}-glow)`}
      />
    </svg>
  );
}

function HorizonStreak({ gradientId, trackClass }: { gradientId: string; trackClass: string }) {
  return (
    <div className="hero-horizon-streak absolute inset-x-0 top-[38%] -translate-y-1/2">
      <div className={`${trackClass} mx-auto w-[140%] max-w-none sm:w-[120%]`}>
        <HorizonSvg gradientId={gradientId} className="h-auto w-full" />
      </div>
    </div>
  );
}

function WaveBand({ gradientId }: { gradientId: string }) {
  return (
    <div className="absolute inset-x-0 bottom-[18%] overflow-hidden opacity-30">
      <div className="hero-wave-band flex w-[200%]">
        {[0, 1].map((i) => (
          <svg
            key={i}
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            className="h-24 w-1/2 shrink-0 sm:h-28"
            aria-hidden
          >
            <defs>
              <linearGradient id={`${gradientId}-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(163, 163, 163, 0)" />
                <stop offset="35%" stopColor="rgba(163, 163, 163, 0.08)" />
                <stop offset="50%" stopColor="rgba(229, 229, 229, 0.06)" />
                <stop offset="65%" stopColor="rgba(163, 163, 163, 0.06)" />
                <stop offset="100%" stopColor="rgba(163, 163, 163, 0)" />
              </linearGradient>
            </defs>
            <path
              d="M0 60 C120 20 240 100 360 60 C480 20 600 100 720 60 C840 20 960 100 1080 60 C1200 20 1320 100 1440 60 L1440 120 L0 120 Z"
              fill={`url(#${gradientId}-${i})`}
            />
            <path
              d="M0 55 C120 15 240 95 360 55 C480 15 600 95 720 55 C840 15 960 95 1080 55 C1200 15 1320 95 1440 55"
              fill="none"
              stroke="rgba(163, 163, 163, 0.18)"
              strokeWidth="1"
            />
          </svg>
        ))}
      </div>
    </div>
  );
}

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function AmbientSnapDust() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const particles = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => {
        const r1 = seededRandom(i * 2.1);
        const r2 = seededRandom(i * 4.7);
        const r3 = seededRandom(i * 6.3);
        const size = 1 + r3 * 2.5;
        return {
          id: i,
          left: `${(r1 * 100).toFixed(2)}%`,
          top: `${(r2 * 100).toFixed(2)}%`,
          size: `${size.toFixed(2)}px`,
          delay: `${(r1 * 8).toFixed(2)}s`,
          duration: `${(7 + r2 * 6).toFixed(2)}s`,
        };
      }),
    []
  );

  if (!mounted) return null;

  return (
    <div className="snap-dust-ambient absolute inset-0 hidden md:block">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="snap-dust-particle absolute rounded-full bg-muted-foreground/45"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            animationDelay: particle.delay,
            ["--dust-drift-speed" as string]: particle.duration,
          }}
        />
      ))}
    </div>
  );
}

export function HeroLivingBackground() {
  const uid = useId().replace(/:/g, "");
  const horizonGrad = `${uid}-horizon`;
  const horizonGrad2 = `${uid}-horizon-2`;
  const waveGrad = `${uid}-wave`;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="hero-living-mesh absolute inset-0" />
      <AmbientSnapDust />
      <HorizonStreak gradientId={horizonGrad} trackClass="hero-horizon-track" />
      <HorizonStreak gradientId={horizonGrad2} trackClass="hero-horizon-track-slow" />
      <WaveBand gradientId={waveGrad} />

      <svg className="grain-overlay absolute inset-0 h-full w-full" aria-hidden>
        <filter id={uid}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.9" />
          </feComponentTransfer>
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${uid})`} />
      </svg>
    </div>
  );
}

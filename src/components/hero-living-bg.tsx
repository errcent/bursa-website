"use client";

import { useId } from "react";

const ORBS = ["hero-orb--a", "hero-orb--b", "hero-orb--c", "hero-orb--d"] as const;

export function HeroLivingBackground() {
  const uid = useId().replace(/:/g, "");

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="hero-orb-field absolute inset-0">
        {ORBS.map((orb) => (
          <div key={orb} className={`hero-orb ${orb}`}>
            <span className="hero-orb-glow" />
          </div>
        ))}
      </div>

      <svg className="hero-aurora-grain absolute inset-0 h-full w-full" aria-hidden>
        <filter id={uid}>
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
        <rect width="100%" height="100%" filter={`url(#${uid})`} />
      </svg>
    </div>
  );
}

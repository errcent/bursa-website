"use client";

import { useId } from "react";

import { HeroLightWave } from "@/components/hero-light-wave";

export function HeroLivingBackground() {
  const uid = useId().replace(/:/g, "");

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="hero-living-mesh absolute inset-0" />

      {/* Wave sits in a centred band with breathing room on both sides so it
          never feels stretched to the screen edges. */}
      <div className="hero-wave-soft absolute left-1/2 top-0 h-[68%] w-[88%] max-w-5xl -translate-x-1/2">
        <HeroLightWave className="h-full w-full" />
      </div>

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

import type { Metadata } from "next";

import { HeroLightWave } from "@/components/hero-light-wave";

export const metadata: Metadata = {
  title: "Wave Lab",
  robots: { index: false, follow: false },
};

/**
 * Experimental preview route for the new hero wave.
 * Visit /wave-lab to compare against the reference video before shipping to the
 * real landing page.
 */
export default function WaveLabPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-neutral-100">
      {/* dark radial backdrop, brightest near the top-center behind the wave */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% 8%, rgba(120,120,130,0.14), transparent 60%), radial-gradient(ellipse 60% 50% at 50% 120%, rgba(80,80,90,0.10), transparent 60%)",
        }}
      />

      <section className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center px-6">
        {/* wave lives in the upper band of the hero */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[52vh] w-full">
          <HeroLightWave className="h-full w-full" />
        </div>

        <div className="relative z-10 mt-[30vh] max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-neutral-300">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-200" />
            Wave Lab · Preview
          </span>
          <h1 className="mt-6 bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-5xl font-semibold leading-tight text-transparent sm:text-6xl">
            Flowing light wave
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-balance text-neutral-400">
            Eksperimen background wave baru untuk landing page. Bandingkan dengan
            video referensi sebelum diterapkan ke halaman bursa.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <button className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black">
              Get Started
            </button>
            <button className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-neutral-200">
              View Services
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

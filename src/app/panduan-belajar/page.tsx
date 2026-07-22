import type { Metadata } from "next";

import { LearningGuidanceQuiz } from "@/components/learning-guidance/learning-guidance-quiz";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { HeroLivingBackground } from "@/components/hero-living-bg";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Panduan Belajar — Belajar dengan Arah yang Jelas",
  description:
    "Quiz singkat (~2 menit) untuk rekomendasi kelas dan mentor trading yang selaras dengan tujuan dan levelmu.",
};

export default function PanduanBelajarPage() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1 overflow-x-clip pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="hero-cinematic page-header-strip relative overflow-hidden border-b border-border/40 py-10 sm:py-14">
          <HeroLivingBackground />
          <div className="container-page relative z-10">
            <Reveal>
              <p className="eyebrow mb-2">Panduan Belajar</p>
              <h1 className="page-hero-title text-gradient max-w-3xl">
                Belajar dengan arah yang jelas
              </h1>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Quiz singkat · ~2 menit · rekomendasi personal
              </p>
              <p className="section-copy mt-4 max-w-2xl text-base sm:text-[1.05rem]">
                Jawab beberapa pertanyaan — kami arahkan ke kelas dan mentor yang selaras dengan
                tujuan dan levelmu.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="container-page section-tight pt-8 sm:pt-10">
          <LearningGuidanceQuiz />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

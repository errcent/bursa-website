import type { Metadata } from "next";

import { LearningGuidanceOverviewActions } from "@/components/learning-guidance/learning-guidance-overview-actions";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { HeroLivingBackground } from "@/components/hero-living-bg";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Panduan Belajar",
  description:
    "Temukan jalur belajar trading yang selaras dengan tujuan dan levelmu melalui quiz singkat Bursa.",
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
              <p className="section-copy mt-4 max-w-2xl text-base sm:text-[1.05rem]">
                Quiz singkat untuk memetakan profil belajarmu, lalu rekomendasi kelas dan mentor
                yang selaras — tanpa komitmen.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="container-page section-tight pt-8 sm:pt-10">
          <LearningGuidanceOverviewActions />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

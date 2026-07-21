import type { Metadata } from "next";

import { LearningGuidanceQuiz } from "@/components/learning-guidance/learning-guidance-quiz";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { HeroLivingBackground } from "@/components/hero-living-bg";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Panduan Belajar — Temukan Jalur yang Tepat",
  description:
    "Quiz singkat untuk rekomendasi kelas dan mentor trading yang disesuaikan dengan profil, tujuan, dan toleransi risikomu.",
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
              <p className="eyebrow mb-2">Jembatannya</p>
              <h1 className="page-hero-title text-gradient max-w-3xl">
                Temukan Jalur Belajar yang Tepat
              </h1>
              <p className="section-copy mt-4 max-w-2xl text-base sm:text-[1.05rem]">
                Banyak trader kehilangan waktu karena belajar dari mentor atau kelas yang tidak
                sesuai profilnya. Jawab beberapa pertanyaan singkat — sekitar 2 menit — dan dapatkan
                rekomendasi kelas & mentor yang disesuaikan dengan tujuan, level, dan ritme belajarmu.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="container-page section-tight">
          <LearningGuidanceQuiz />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

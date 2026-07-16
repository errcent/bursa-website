import type { Metadata } from "next";

import { LearningGuidanceQuiz } from "@/components/learning-guidance/learning-guidance-quiz";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { HeroLivingBackground } from "@/components/hero-living-bg";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Panduan Belajar — Temukan Jalur yang Tepat",
  description:
    "Kuis singkat untuk menemukan kelas dan mentor trading yang sesuai profil, tujuan, dan toleransi risikomu.",
};

export default function PanduanBelajarPage() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1 overflow-x-clip pb-10">
        <div className="hero-cinematic relative overflow-hidden border-b border-border/60 py-8 sm:py-14">
          <HeroLivingBackground />
          <div className="container-page relative z-10">
            <Reveal>
              <p className="eyebrow mb-2">Jembatannya</p>
              <h1 className="page-hero-title text-gradient max-w-3xl">
                Temukan Jalur Belajar yang Tepat
              </h1>
              <p className="section-copy mt-3 max-w-2xl">
                Banyak trader kehilangan waktu karena belajar dari mentor atau modul yang tidak
                sesuai profilnya. Jawab 8 pertanyaan singkat — kami bantu arahkan ke kelas dan
                mentor yang relevan.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="container-page section-spacious">
          <LearningGuidanceQuiz />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

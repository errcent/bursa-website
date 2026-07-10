"use client";

import { HeroLivingBackground } from "@/components/hero-living-bg";
import { Reveal } from "@/components/motion/reveal";

export function KatalogHero({ query }: { query?: string }) {
  const trimmed = query?.trim();

  return (
    <div className="hero-cinematic katalog-hero-compact relative overflow-hidden border-b border-border/60 py-7 sm:py-16">
      <HeroLivingBackground />
      <div className="container-page relative z-10">
        <Reveal y={20}>
          <p className="eyebrow mb-1.5 sm:mb-3">
            {trimmed ? "Hasil Pencarian" : "Discovery"}
          </p>
          <h1 className="page-hero-title text-gradient">
            {trimmed ? (
              <>
                &ldquo;{trimmed}&rdquo;
              </>
            ) : (
              "Katalog Belajar Trading"
            )}
          </h1>
          <p className="section-copy mt-2 hidden max-w-2xl sm:mt-3 sm:block">
            {trimmed
              ? `Menampilkan kelas dan mentor terkait "${trimmed}". Temukan edukasi trading saham, crypto, dan forex dari instruktur terverifikasi.`
              : "Mulai dari instrumen yang kamu minati, lalu pilih kelas atau mentor paling cocok dengan levelmu. Semua dalam satu alur discovery yang rapi."}
          </p>
        </Reveal>
      </div>
    </div>
  );
}

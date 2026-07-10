"use client";

import { HeroLivingBackground } from "@/components/hero-living-bg";
import { Reveal } from "@/components/motion/reveal";

export function KatalogHero({ query }: { query?: string }) {
  const trimmed = query?.trim();

  return (
    <div className="hero-cinematic relative overflow-hidden border-b border-border/60 py-14 sm:py-16">
      <HeroLivingBackground />
      <div className="container-page relative z-10">
        <Reveal y={28}>
          <p className="eyebrow mb-3">
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
          <p className="section-copy mt-3 max-w-2xl">
            {trimmed
              ? `Menampilkan kelas dan mentor terkait "${trimmed}". Temukan edukasi trading saham, crypto, dan forex dari instruktur terverifikasi.`
              : "Mulai dari instrumen yang kamu minati, lalu pilih kelas atau mentor paling cocok dengan levelmu. Semua dalam satu alur discovery yang rapi."}
          </p>
        </Reveal>
      </div>
    </div>
  );
}

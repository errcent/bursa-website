"use client";

import { motion } from "motion/react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { WordReveal } from "@/components/motion/word-reveal";

const painPoints = [
  {
    num: "01",
    title: "Masuk Pasar dengan Fondasi Rapuh",
    description:
      "Banyak trader ambil posisi sebelum benar-benar paham risikonya. Pemula, menengah, bahkan profesional — fondasi yang rapuh membuat setiap keputusan jadi taruhan, bukan perhitungan.",
  },
  {
    num: "02",
    title: "Mengikuti Gaya yang Tidak Cocok",
    description:
      "Meniru gaya trading atau manajemen risiko orang lain — mentor, tren, influencer — tanpa menyesuaikan profilmu sendiri. Cara cepat kehilangan kendali atas keputusan.",
  },
  {
    num: "03",
    title: "Kebanjiran Informasi Tanpa Jalur Jelas",
    description:
      "Artikel, video, grup chat, saran mentor — sumber belajar berceceran dan sering saling bertentangan. Waktu habis menyaring noise, bukan membangun pemahaman yang kokoh.",
  },
] as const;

export function HomeProblemSection() {
  return (
    <section id="hambatan-trader" className="section-cinematic-dark scroll-mt-24">
      <div className="container-page relative z-[2]">
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <Reveal>
            <p className="eyebrow-tight mb-4">Hambatan Trader</p>
          </Reveal>
          <WordReveal
            as="h2"
            className="section-display-title"
            text="Tiga hal yang diam-diam menggerogoti akunmu"
            trigger="inView"
            delay={0.04}
          />
          <Reveal delay={0.1} className="mt-5">
            <p className="section-copy mx-auto max-w-2xl text-base sm:text-lg">
              Riset akademis menemukan pola yang sama berulang — ketiganya bekerja
              diam-diam, sebelum kamu sadar dampaknya.
            </p>
          </Reveal>
        </div>

        <Stagger className="grid gap-4 sm:gap-5 md:grid-cols-3 md:gap-6">
          {painPoints.map((point) => (
            <StaggerItem key={point.num}>
              <motion.article
                className="editorial-card flex h-full flex-col p-5 sm:p-6 md:p-8"
                whileHover={{ y: -3 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <span
                  className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-accent/80 md:hidden"
                  aria-hidden
                >
                  Hambatan {point.num}
                </span>
                <span className="editorial-num hidden md:block" aria-hidden>
                  {point.num}
                </span>
                <h3 className="mt-2 font-heading text-[1.0625rem] font-semibold leading-snug text-foreground sm:mt-2.5 sm:text-lg md:mt-3 md:text-xl">
                  {point.title}
                </h3>
                <p className="mt-2.5 flex-1 text-[0.9375rem] leading-[1.65] text-muted-foreground/90 md:mt-3">
                  {point.description}
                </p>
              </motion.article>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.12} className="mt-10 text-center md:mt-14">
          <p className="editorial-citation mx-auto max-w-2xl font-mono text-[10px] leading-relaxed sm:text-[11px]">
            Berdasarkan studi akademik 2025 tentang hambatan trader pemula,
            dipublikasikan di International Conference on Pervasive Computational
            Technologies (ICPCT).
          </p>
        </Reveal>
      </div>
    </section>
  );
}

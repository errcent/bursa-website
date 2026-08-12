"use client";

import { motion } from "motion/react";

import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { WordReveal } from "@/components/motion/word-reveal";

const painPoints = [
  {
    num: "01",
    title: "Masuk Pasar dengan Fondasi Rapuh",
    description:
      "Posisi dibuka sebelum risiko dipahami. Fondasi rapuh membuat setiap keputusan jadi taruhan.",
  },
  {
    num: "02",
    title: "Mengikuti Gaya yang Tidak Cocok",
    description:
      "Meniru gaya orang lain tanpa menyesuaikan profil risikomu sendiri.",
  },
  {
    num: "03",
    title: "Kebanjiran Informasi Tanpa Jalur Jelas",
    description:
      "Sumber belajar berceceran dan saling bertentangan. Waktu habis memilah, bukan belajar.",
  },
] as const;

export function HomeProblemSection() {
  return (
    <section id="hambatan-trader" className="section-cinematic-dark scroll-mt-24">
      <div className="container-page relative z-[2]">
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <WordReveal
            as="h2"
            className="section-display-title"
            text="Tiga hambatan trader"
            trigger="inView"
            delay={0.04}
          />
        </div>

        <Stagger className="grid gap-4 sm:gap-5 md:grid-cols-3 md:gap-6">
          {painPoints.map((point) => (
            <StaggerItem key={point.num}>
              <motion.article
                className="editorial-card flex h-full flex-col p-5 sm:p-6 md:p-8"
                whileHover={{ y: -3 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
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
      </div>
    </section>
  );
}

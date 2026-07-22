"use client";

import { motion } from "motion/react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { WordReveal } from "@/components/motion/word-reveal";

const proofPoints = [
  {
    step: "01",
    title: "Pilih instrumen dan level",
    description: "Sesuaikan dengan pengalamanmu — saham, crypto, atau forex.",
  },
  {
    step: "02",
    title: "Ikuti video berurutan",
    description: "Belajar langkah demi langkah dengan urutan materi yang jelas.",
  },
  {
    step: "03",
    title: "Mulai dari preview gratis",
    description: "Jelajahi cuplikan kelas di katalog — tanpa komitmen.",
  },
];

export function HomeProofPointsSection() {
  return (
    <section className="section-muted section-tight">
      <div className="container-page">
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <Reveal>
            <p className="eyebrow-tight mb-4">Alur Belajar</p>
          </Reveal>
          <WordReveal
            as="h2"
            className="section-display-title text-foreground"
            text="Tiga langkah ke kelas pertamamu"
            trigger="inView"
            delay={0.04}
          />
          <Reveal delay={0.1} className="mt-4">
            <p className="section-copy mx-auto max-w-lg text-base">
              Pilih kelas, pelajari alurnya, dan coba preview gratis di katalog.
            </p>
          </Reveal>
        </div>

        <Stagger className="premium-timeline">
          {proofPoints.map((item) => (
            <StaggerItem key={item.step}>
              <motion.div
                className="premium-timeline-step editorial-card-light p-6 sm:p-8"
                whileHover={{ y: -3 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="editorial-num" aria-hidden>
                  {item.step}
                </span>
                <h3 className="mt-2 font-heading text-lg font-semibold text-foreground sm:text-xl">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                  {item.description}
                </p>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

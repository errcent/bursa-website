"use client";

import { motion } from "motion/react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { WordReveal } from "@/components/motion/word-reveal";

const solutionRows = [
  {
    num: "01",
    threat: "Fondasi rapuh, keputusan jadi taruhan",
    safety: "Kurikulum bertahap yang memastikan dasarmu kokoh sebelum lanjut",
  },
  {
    num: "02",
    threat: "Ikut gaya orang lain yang tidak cocok",
    safety: "Jalur belajar disesuaikan dengan profil risiko dan gaya trading-mu",
  },
  {
    num: "03",
    threat: "Informasi bercecer, waktu habis memilah bukan belajar",
    safety:
      "Materi Bursa disusun berurutan agar kamu belajar yang perlu, bukan yang beredar",
  },
] as const;

export function HomeSolutionSection() {
  return (
    <section className="section-cinematic-light section-tight">
      <div className="container-page">
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <Reveal>
            <p className="eyebrow-tight mb-4">Solusi Bursa</p>
          </Reveal>
          <WordReveal
            as="h2"
            className="section-display-title text-foreground"
            text="Kamu tidak perlu melangkah sendirian"
            trigger="inView"
            delay={0.04}
          />
          <Reveal delay={0.1} className="mt-5">
            <p className="section-copy mx-auto max-w-xl text-base">
              Setiap hambatan punya jawaban. Bursa dirancang untuk menggantikan
              kebingungan dengan struktur yang jelas.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.05}>
          <div className="editorial-card-light mx-auto max-w-4xl overflow-hidden">
            <Stagger className="divide-y divide-border/50" delay={0.04}>
              {solutionRows.map((row) => (
                <StaggerItem key={row.num}>
                  <motion.div
                    className="solution-pair group"
                    whileHover={{
                      backgroundColor:
                        "color-mix(in oklch, var(--card) 94%, var(--accent) 6%)",
                    }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="solution-pair-item">
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
                        Hambatan {row.num}
                      </span>
                      <p className="break-words text-[0.9375rem] leading-relaxed text-muted-foreground">
                        {row.threat}
                      </p>
                    </div>
                    <div className="solution-pair-item">
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                        Solusi Bursa
                      </span>
                      <p className="break-words font-heading text-base font-medium leading-relaxed text-foreground">
                        {row.safety}
                      </p>
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Reveal>

        <Reveal delay={0.12} className="mt-10 text-center md:mt-14">
          <p className="mx-auto max-w-xl text-base leading-relaxed text-foreground/85">
            Trading selalu ada risikonya. Risiko karena salah belajar — itu yang
            kami bantu hilangkan.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

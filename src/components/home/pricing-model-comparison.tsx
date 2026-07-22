"use client";

import { Check, X } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";

const bursaPoints = [
  "Bayar sekali per kelas yang kamu pilih",
  "Akses materi selamanya setelah dibeli",
  "Tanpa biaya bulanan atau auto-renewal",
];

const subscriptionPoints = [
  "Tetap bayar bulanan walau tidak belajar",
  "Akses hilang begitu berhenti berlangganan",
  "Materi bisa berubah tanpa kejelasan",
];

/** Lightweight "Model Harga" comparison — pay-per-class vs. typical subscription. */
export function PricingModelComparison() {
  return (
    <Reveal delay={0.15} className="mt-14 sm:mt-16 md:mt-20">
      <div className="mx-auto max-w-3xl">
        <p className="mb-6 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Model Harga
        </p>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Checkout per kelas segera dibuka — gabung waitlist untuk kabar peluncuran.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <div className="comparison-panel comparison-panel--highlight">
            <p className="font-heading text-base font-semibold text-foreground sm:text-lg">
              Bayar per kelas
            </p>
            <p className="mt-0.5 text-xs text-accent">Cara Bursa</p>
            <ul className="mt-5 space-y-3">
              {bursaPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90"
                >
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-accent"
                    strokeWidth={2}
                  />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="comparison-panel comparison-panel--muted">
            <p className="font-heading text-base font-semibold text-muted-foreground sm:text-lg">
              Langganan bulanan
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/70">
              Model umum lainnya
            </p>
            <ul className="mt-5 space-y-3">
              {subscriptionPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground/80"
                >
                  <X
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground/50"
                    strokeWidth={2}
                  />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

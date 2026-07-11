"use client";

import { Check, X } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const bursaPoints = [
  "Bayar sekali per kelas yang kamu pilih",
  "Akses materi selamanya setelah dibeli",
  "Tanpa biaya bulanan atau auto-renewal",
];

const subscriptionPoints = [
  "Tetap bayar bulanan walau tidak belajar",
  "Akses hilang begitu berhenti berlangganan",
  "Materi bisa berubah-ubah tanpa kejelasan",
];

/** Lightweight "Model Harga" comparison — pay-per-class vs. typical subscription. */
export function PricingModelComparison() {
  return (
    <Reveal delay={0.15} className="mt-8 sm:mt-10">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Model harga
        </p>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="rounded-xl border border-accent/25 bg-accent-soft/30 p-4 sm:p-5">
            <p className="font-heading text-sm font-semibold">Bayar per kelas — cara Bursa</p>
            <ul className="mt-3 space-y-2">
              {bursaPoints.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-accent" strokeWidth={2.5} />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className={cn("rounded-xl border border-border/60 bg-surface/40 p-4 sm:p-5")}>
            <p className="font-heading text-sm font-semibold text-muted-foreground">
              Langganan bulanan — model umum lainnya
            </p>
            <ul className="mt-3 space-y-2">
              {subscriptionPoints.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground/80">
                  <X className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60" strokeWidth={2.5} />
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

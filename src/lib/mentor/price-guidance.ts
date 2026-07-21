import type { Instrument, Level } from "@/lib/types";

/**
 * NON-BINDING price guidance for the mentor application (QC-20260719-44).
 *
 * LOCKED constraints preserved: pricing stays mentor-set, there is NO price floor
 * and NO enforcement. These reference ranges only reduce bad anchoring for new
 * mentors and are paired with the message that discovery ranking is non-price
 * (QC-20260719-02) — so undercutting does NOT buy visibility.
 */
export interface PriceGuidance {
  min: number;
  typical: number;
  max: number;
  currency: "IDR";
  note: string;
}

const BASE_RANGE: Record<Instrument, { min: number; typical: number; max: number }> = {
  Saham: { min: 150_000, typical: 450_000, max: 1_200_000 },
  Crypto: { min: 150_000, typical: 500_000, max: 1_500_000 },
  Forex: { min: 200_000, typical: 550_000, max: 1_500_000 },
};

const LEVEL_MULTIPLIER: Record<Level, number> = {
  Pemula: 0.8,
  Menengah: 1,
  Mahir: 1.4,
};

const GUIDANCE_NOTE =
  "Rentang referensi (non-binding). Harga tetap sepenuhnya kamu tentukan — tidak ada batas bawah. " +
  "Peringkat & discovery TIDAK berbasis harga, jadi banting harga tidak menaikkan visibilitas.";

export function getPriceGuidance(instrument: Instrument, level: Level): PriceGuidance {
  const base = BASE_RANGE[instrument];
  const mult = LEVEL_MULTIPLIER[level];
  const round = (v: number) => Math.round((v * mult) / 10_000) * 10_000;
  return {
    min: round(base.min),
    typical: round(base.typical),
    max: round(base.max),
    currency: "IDR",
    note: GUIDANCE_NOTE,
  };
}

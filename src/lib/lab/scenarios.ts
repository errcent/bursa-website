export type LabScenario = {
  id: string;
  title: string;
  description: string;
  toolIds: string[];
};

/** Guided entry paths — link chains of Essential tools only. */
export const labScenarios: LabScenario[] = [
  {
    id: "pre-entry",
    title: "Persiapan sebelum entry",
    description: "Ukur risiko, validasi R:R, lalu hitung breakeven setelah biaya.",
    toolIds: ["position-size", "risk-reward", "breakeven", "commission-slippage"],
  },
  {
    id: "forex-setup",
    title: "Setup forex & CFD",
    description: "Nilai pip, konversi lot, dan margin sebelum buka posisi.",
    toolIds: ["pip-value", "lot-size", "margin-leverage"],
  },
  {
    id: "strategy-check",
    title: "Cek edge strategi",
    description: "Expectancy matematis lalu simulasi Monte Carlo untuk variasi hasil.",
    toolIds: ["trade-expectancy", "monte-carlo"],
  },
];

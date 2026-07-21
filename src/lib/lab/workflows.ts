import type { LucideIcon } from "lucide-react";
import { Crosshair, LineChart, ShieldCheck, Target } from "lucide-react";

export type LabWorkflow = {
  id: string;
  title: string;
  description: string;
  toolIds: string[];
  icon: LucideIcon;
  accent: string;
};

export const labWorkflows: LabWorkflow[] = [
  {
    id: "pre-entry",
    title: "Persiapan sebelum entry",
    description:
      "Rangkaian tiga langkah: ukur risiko, validasi R:R, lalu tentukan harga impas setelah biaya.",
    toolIds: ["position-size", "risk-reward", "breakeven"],
    icon: Target,
    accent: "text-emerald",
  },
  {
    id: "strategy-validation",
    title: "Validasi strategi",
    description:
      "Uji edge matematis strategi lewat expectancy, simulasi Monte Carlo, dan backtest aturan sederhana.",
    toolIds: ["trade-expectancy", "monte-carlo", "backtester"],
    icon: LineChart,
    accent: "text-accent",
  },
  {
    id: "forex-mechanics",
    title: "Mekanika forex & CFD",
    description:
      "Pahami nilai pip, konversi lot, margin, swap, dan dampak biaya sebelum membuka posisi.",
    toolIds: ["pip-value", "lot-size", "margin-leverage", "swap-rollover"],
    icon: Crosshair,
    accent: "text-amber",
  },
  {
    id: "performance-review",
    title: "Review performa trading",
    description:
      "Lacak R-multiple, ukur dampak biaya, dan estimasi risiko agregat portofolio.",
    toolIds: ["r-multiple", "commission-slippage", "portfolio-var"],
    icon: ShieldCheck,
    accent: "text-profit",
  },
];

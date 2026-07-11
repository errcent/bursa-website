import type { LucideIcon } from "lucide-react";
import { Calculator, Dices, Gauge, LineChart } from "lucide-react";

export type LabTool = {
  id: string;
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Short tag shown on the hub card, e.g. "Simulasi", "Kalkulator". */
  tag: string;
};

/**
 * Central registry for Lab tools. Add a new entry here (plus its route under
 * `src/app/lab/<id>/page.tsx`) to expose another tool on the hub page.
 */
export const labTools: LabTool[] = [
  {
    id: "monte-carlo",
    href: "/lab/monte-carlo",
    title: "Monte Carlo Simulator",
    description:
      "Simulasikan ribuan skenario trading acak untuk melihat rentang kemungkinan hasil akhir modal berdasarkan win rate, rata-rata untung, dan rata-rata rugi.",
    icon: Dices,
    tag: "Simulasi",
  },
  {
    id: "risk-reward-matrix",
    href: "/lab/risk-reward-matrix",
    title: "Risk to Reward Expectancy Matrix",
    description:
      "Lihat matriks ekspektasi (expectancy) di berbagai kombinasi win rate dan rasio risk:reward untuk menilai apakah sebuah strategi trading masuk akal secara matematis.",
    icon: LineChart,
    tag: "Matriks",
  },
  {
    id: "floating-calculator",
    href: "/lab/floating-calculator",
    title: "Kalkulator Floating",
    description:
      "Hitung floating profit/loss dari harga entry dan harga saat ini, atau cari harga target dari floating yang diinginkan.",
    icon: Gauge,
    tag: "Kalkulator",
  },
  {
    id: "fair-value",
    href: "/lab/fair-value",
    title: "Kalkulator Fair Value Saham",
    description:
      "Estimasi nilai wajar saham per lembar dengan model DCF sederhana (pertumbuhan EPS) atau pendekatan P/E pembanding.",
    icon: Calculator,
    tag: "Kalkulator",
  },
];

export function getLabTool(id: string): LabTool | undefined {
  return labTools.find((tool) => tool.id === id);
}

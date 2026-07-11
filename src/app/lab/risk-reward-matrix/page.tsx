import type { Metadata } from "next";

import { LabToolLayout } from "@/components/lab/lab-tool-layout";
import { RiskRewardMatrix } from "@/components/lab/risk-reward-matrix";
import { getLabTool } from "@/lib/lab/tools";

export const metadata: Metadata = {
  title: "Risk to Reward Expectancy Matrix",
  description:
    "Matriks ekspektasi (expectancy) di berbagai kombinasi win rate dan rasio risk:reward untuk menilai kelayakan strategi trading secara matematis.",
};

export default function RiskRewardMatrixPage() {
  const tool = getLabTool("risk-reward-matrix")!;

  return (
    <LabToolLayout
      icon={tool.icon}
      tag={tool.tag}
      title={tool.title}
      description={tool.description}
      assumptions={[
        "Expectancy dihitung dalam satuan R, dengan asumsi risiko per trade selalu 1R (ukuran posisi disesuaikan agar rugi maksimum = 1R).",
        "Rumus: Expectancy (R) = (Win rate × R:R) − (1 − Win rate) × 1.",
        "Belum memasukkan biaya transaksi, slippage, atau pajak — hanya gambaran matematis murni dari win rate dan risk:reward.",
        "Expectancy positif berarti strategi secara matematis menguntungkan dalam jangka panjang, bukan garansi profit di setiap sesi.",
      ]}
    >
      <RiskRewardMatrix />
    </LabToolLayout>
  );
}

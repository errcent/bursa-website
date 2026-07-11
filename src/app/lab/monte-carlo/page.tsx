import type { Metadata } from "next";

import { LabToolLayout } from "@/components/lab/lab-tool-layout";
import { MonteCarloSimulator } from "@/components/lab/monte-carlo-simulator";
import { getLabTool } from "@/lib/lab/tools";

export const metadata: Metadata = {
  title: "Monte Carlo Simulator",
  description:
    "Simulasikan ribuan skenario trading acak berdasarkan win rate, rata-rata untung, dan rata-rata rugi untuk melihat rentang kemungkinan hasil akhir modal.",
};

export default function MonteCarloPage() {
  const tool = getLabTool("monte-carlo")!;

  return (
    <LabToolLayout
      icon={tool.icon}
      tag={tool.tag}
      title={tool.title}
      description={tool.description}
      assumptions={[
        "Setiap trade dianggap independen (hasil trade sebelumnya tidak memengaruhi probabilitas trade berikutnya).",
        "Rata-rata untung dan rata-rata rugi dihitung sebagai persentase dari saldo saat itu (compounding), bukan nilai nominal tetap.",
        "Simulasi berjalan sepenuhnya di browser — semakin besar jumlah simulasi × jumlah trade, semakin lama waktu hitungnya.",
        "Ini adalah alat edukasi untuk memahami variansi hasil, bukan prediksi atau garansi performa trading nyata.",
      ]}
    >
      <MonteCarloSimulator />
    </LabToolLayout>
  );
}

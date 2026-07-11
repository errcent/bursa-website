import type { Metadata } from "next";

import { FloatingCalculator } from "@/components/lab/floating-calculator";
import { LabToolLayout } from "@/components/lab/lab-tool-layout";
import { getLabTool } from "@/lib/lab/tools";

export const metadata: Metadata = {
  title: "Kalkulator Floating",
  description:
    "Hitung floating profit/loss dari harga entry dan harga saat ini, atau cari harga target dari floating yang diinginkan.",
};

export default function FloatingCalculatorPage() {
  const tool = getLabTool("floating-calculator")!;

  return (
    <LabToolLayout
      icon={tool.icon}
      tag={tool.tag}
      title={tool.title}
      description={tool.description}
      assumptions={[
        "Floating dihitung sebagai persentase perubahan harga terhadap harga entry — belum memperhitungkan lot, margin, atau biaya swap/komisi.",
        "Mode Long (Beli) untung ketika harga naik; mode Short (Jual) untung ketika harga turun.",
        "Estimasi pip bersifat opsional dan sederhana: selisih harga dibagi ukuran pip yang kamu tentukan (umumnya 0.0001 untuk pair mayor, 0.01 untuk pair XXX/JPY).",
        "Field leverage hanya mengalikan persentase floating untuk estimasi kasar dampak terhadap margin — bukan perhitungan margin call atau stop-out yang presisi.",
      ]}
    >
      <FloatingCalculator />
    </LabToolLayout>
  );
}

import type { Metadata } from "next";

import { FairValueCalculator } from "@/components/lab/fair-value-calculator";
import { LabToolLayout } from "@/components/lab/lab-tool-layout";
import { getLabTool } from "@/lib/lab/tools";

export const metadata: Metadata = {
  title: "Kalkulator Fair Value Saham",
  description:
    "Estimasi nilai wajar saham per lembar dengan model DCF sederhana (pertumbuhan EPS) atau pendekatan P/E pembanding.",
};

export default function FairValuePage() {
  const tool = getLabTool("fair-value")!;

  return (
    <LabToolLayout
      icon={tool.icon}
      tag={tool.tag}
      title={tool.title}
      description={tool.description}
      assumptions={[
        "Model DCF menggunakan EPS sebagai proksi laba pemilik (owner earnings) per lembar — bukan free cash flow aktual perusahaan.",
        "Discount rate sebaiknya lebih besar dari terminal growth rate, jika tidak hasil dianggap tidak valid.",
        "Model P/E pembanding hanya mengalikan EPS dengan rasio P/E acuan (industri/peer) — sesederhana mungkin, tanpa penyesuaian kualitas laba.",
        "Ini adalah estimasi edukasi berbasis asumsi yang kamu masukkan sendiri, bukan rekomendasi beli/jual atau riset fundamental lengkap.",
      ]}
    >
      <FairValueCalculator />
    </LabToolLayout>
  );
}

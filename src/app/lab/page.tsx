import type { Metadata } from "next";
import { Lock } from "lucide-react";

import { InfoPageHero } from "@/components/info-page-hero";
import { LabHubContent } from "@/components/lab/lab-hub-content";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { labTools } from "@/lib/lab/tools";

export const metadata: Metadata = {
  title: "Bursa Lab · Kalkulator Trading",
  description:
    "Kalkulator dan simulator trading client-side untuk risiko, biaya, dan probabilitas, saham, forex, dan crypto.",
};

export default function LabPage() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1 overflow-x-clip">
        <InfoPageHero
          eyebrow="Alat edukasi"
          title="Bursa Lab"
          description="Kalkulator trading client-side untuk risiko, biaya, dan probabilitas."
        />
        <div className="container-page -mt-2 pb-2 sm:-mt-4">
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5 shrink-0" aria-hidden />
            Input tidak dikirim ke server · {labTools.length} tool
          </p>
        </div>

        <div className="container-page section-tight pb-16 pt-6 sm:pt-8">
          <LabHubContent />

          <p className="lab-disclaimer mt-12">
            Perhitungan bersifat edukatif, bukan rekomendasi investasi. Hasil bergantung pada asumsi
            yang kamu masukkan.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

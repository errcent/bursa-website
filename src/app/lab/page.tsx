import type { Metadata } from "next";

import { LabHubContent } from "@/components/lab/lab-hub-content";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";

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

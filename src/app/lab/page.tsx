import type { Metadata } from "next";

import { InfoPageHero } from "@/components/info-page-hero";
import { LabToolCard } from "@/components/lab/lab-tool-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { labTools } from "@/lib/lab/tools";

export const metadata: Metadata = {
  title: "Lab",
  description:
    "Kumpulan kalkulator dan simulator trading interaktif: Monte Carlo, matriks risk:reward, floating P/L, dan fair value saham.",
};

export default function LabPage() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <InfoPageHero
          eyebrow="Bursa Lab"
          title="Tools trading & analisis"
          description="Kumpulan kalkulator dan simulator interaktif untuk membantu latihan manajemen risiko dan analisis — langsung di browser, tanpa perlu install apa pun."
        />

        <div className="container-page section-tight">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {labTools.map((tool) => (
              <LabToolCard key={tool.id} tool={tool} />
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-border/60 bg-accent-soft/40 p-4 sm:p-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Semua kalkulator di Lab bersifat edukasi dan berjalan sepenuhnya di perangkatmu
              (client-side) — tidak ada data yang dikirim ke server. Hasil hitungan adalah simulasi
              berdasarkan asumsi yang kamu masukkan, bukan rekomendasi atau garansi hasil trading
              nyata.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

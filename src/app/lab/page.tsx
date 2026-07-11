import type { Metadata } from "next";

import { InfoPageHero } from "@/components/info-page-hero";
import { LabToolCard } from "@/components/lab/lab-tool-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { Reveal } from "@/components/motion/reveal";
import { labCategories, getLabToolsByCategory } from "@/lib/lab/tools";

export const metadata: Metadata = {
  title: "Lab",
  description:
    "Kumpulan 37+ kalkulator dan simulator trading interaktif: manajemen risiko, valuasi saham, backtesting, dan analisis portofolio.",
};

export default function LabPage() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <InfoPageHero
          eyebrow="Bursa Lab"
          title="Tools trading & analisis"
          description="37+ kalkulator dan simulator interaktif untuk manajemen risiko, valuasi, backtesting, dan analisis portofolio — langsung di browser."
        />

        <div className="container-page section-tight">
          <div className="flex flex-col gap-12">
            {labCategories.map((category) => {
              const tools = getLabToolsByCategory(category.id);
              if (tools.length === 0) return null;
              return (
                <Reveal key={category.id}>
                  <div>
                    <h2 className="font-heading text-lg font-semibold tracking-tight sm:text-xl">
                      {category.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {tools.map((tool) => (
                        <LabToolCard key={tool.id} tool={tool} />
                      ))}
                    </div>
                  </div>
                </Reveal>
              );
            })}
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

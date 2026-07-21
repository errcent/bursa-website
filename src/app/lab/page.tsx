import type { Metadata } from "next";

import { LabHubContent } from "@/components/lab/lab-hub-content";
import { Reveal } from "@/components/motion/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";

export const metadata: Metadata = {
  title: "Bursa Lab — Tools Trading Interaktif",
  description:
    "19 kalkulator dan simulator trading premium untuk saham, crypto, dan forex — manajemen risiko, Monte Carlo, dan backtesting. Semua berjalan di browser.",
};

export default function LabPage() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <div className="container-page section-tight pb-16">
          <LabHubContent />

          <Reveal className="mt-14">
            <div className="rounded-2xl border border-border/60 bg-accent-soft/30 p-5 sm:p-6">
              <p className="text-sm font-medium text-foreground/90">Catatan edukasi</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Semua perhitungan di Bursa Lab bersifat edukatif dan berjalan client-side — tidak ada
                data input yang dikirim ke server. Hasil simulasi bergantung pada asumsi yang kamu
                masukkan; bukan rekomendasi investasi atau jaminan performa trading nyata.
              </p>
            </div>
          </Reveal>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

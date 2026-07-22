import type { Metadata } from "next";
import { FlaskConical, Lock, Sparkles, Zap } from "lucide-react";

import { LabHubContent } from "@/components/lab/lab-hub-content";
import { HeroLivingBackground } from "@/components/hero-living-bg";
import { Reveal } from "@/components/motion/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { labTools } from "@/lib/lab/tools";

export const metadata: Metadata = {
  title: "Bursa Lab — Tools Trading Interaktif",
  description:
    "19 kalkulator dan simulator trading premium untuk saham, crypto, dan forex — manajemen risiko, Monte Carlo, dan backtesting. Semua berjalan di browser.",
};

export default function LabPage() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1 overflow-x-clip">
        <div className="hero-cinematic page-header-strip relative overflow-hidden border-b border-border/40 py-10 sm:py-14">
          <HeroLivingBackground />
          <div className="container-page relative z-10">
            <Reveal>
              <p className="eyebrow mb-2">Bursa Lab</p>
              <h1 className="page-hero-title text-gradient max-w-3xl">
                Tools trading yang presisi
              </h1>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {labTools.length} kalkulator · client-side · tanpa login
              </p>
              <p className="section-copy mt-4 max-w-2xl text-base sm:text-[1.05rem]">
                Kalkulator dan simulator interaktif untuk risiko, expectancy, mekanika pasar, dan
                backtest — dirancang untuk keputusan trading yang lebih terukur.
              </p>

              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground sm:text-[13px]">
                <li className="inline-flex items-center gap-1.5">
                  <Zap className="size-3.5 text-accent" aria-hidden />
                  Hasil instan di browser
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Lock className="size-3.5 text-accent" aria-hidden />
                  Input tidak dikirim ke server
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-accent" aria-hidden />
                  Gratis untuk semua pengguna
                </li>
              </ul>
            </Reveal>
          </div>
        </div>

        <div className="container-page section-tight pb-16 pt-8 sm:pt-10">
          <LabHubContent />

          <Reveal className="mt-14">
            <div className="lab-disclaimer">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/30 text-muted-foreground">
                  <FlaskConical className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium tracking-tight text-foreground/90">
                    Catatan edukasi
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Semua perhitungan di Bursa Lab bersifat edukatif dan berjalan client-side — tidak
                    ada data input yang dikirim ke server. Hasil simulasi bergantung pada asumsi yang
                    kamu masukkan; bukan rekomendasi investasi atau jaminan performa trading nyata.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

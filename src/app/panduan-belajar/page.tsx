import type { Metadata } from "next";

import { LearningGuidanceOverviewActions } from "@/components/learning-guidance/learning-guidance-overview-actions";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";

export const metadata: Metadata = {
  title: "Panduan Belajar",
  description:
    "Temukan jalur belajar trading dan investasi yang selaras dengan tujuan dan levelmu melalui quiz singkat Bursa.",
};

export default function PanduanBelajarPage() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1 overflow-x-clip pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="container-page section-tight pt-6 sm:pt-8">
          <header className="mb-8">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Panduan Belajar
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Temukan jalur belajar trading dan investasi yang selaras dengan tujuan dan levelmu.
            </p>
          </header>
          <LearningGuidanceOverviewActions />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

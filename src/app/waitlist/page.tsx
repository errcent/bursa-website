import type { Metadata } from "next";
import { Suspense } from "react";

import { HeroLivingBackground } from "@/components/hero-living-bg";
import { Reveal } from "@/components/motion/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { DaftarClosedBanner } from "@/components/waitlist/daftar-closed-banner";
import { WaitlistForm } from "@/components/waitlist-form";

export const metadata: Metadata = {
  title: "Gabung Waitlist",
  description:
    "Kabari emailmu saat Bursa dibuka: edukasi trading dan investasi terstruktur, terkurasi bersama praktisi.",
};

export default function WaitlistPage() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1 overflow-x-clip">
        <section className="hero-cinematic relative min-h-[calc(100dvh-var(--site-header-offset)-4rem)]">
          <HeroLivingBackground />
          <div
            aria-hidden
            className="hero-text-scrim pointer-events-none absolute inset-0 z-[1]"
          />

          <div className="container-page relative z-10 flex min-h-[inherit] items-center px-4 py-16 sm:px-8 sm:py-20">
            <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
              <Reveal>
                <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Gabung waitlist
                </h1>
              </Reveal>
              <Reveal delay={0.08}>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                  Kabari emailmu saat kelas & mentor siap dibuka.
                </p>
              </Reveal>
              <Reveal delay={0.16} className="mt-8 w-full">
                <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-muted/20" />}>
                  <DaftarClosedBanner />
                  <WaitlistForm />
                </Suspense>
              </Reveal>
              <Reveal delay={0.24}>
                <p className="mt-6 text-[11px] text-muted-foreground/70">
                  Tanpa spam · unsubscribe kapan saja
                </p>
              </Reveal>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

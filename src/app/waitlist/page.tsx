import type { Metadata } from "next";
import { Suspense } from "react";

import { HeroLivingBackground } from "@/components/hero-living-bg";
import { Reveal } from "@/components/motion/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { WaitlistForm } from "@/components/waitlist-form";

export const metadata: Metadata = {
  title: "Gabung Waitlist — Bursa",
  description:
    "Daftar ke waitlist Bursa dan jadi yang pertama tahu saat platform edukasi trading kami dibuka.",
};

const perks = [
  "Akses lebih awal ke katalog kelas & mentor terverifikasi",
  "Info pertama saat pendaftaran dibuka",
  "Tanpa spam — kami hanya kirim kabar penting",
];

export default function WaitlistPage() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1 overflow-x-clip">
        <section className="hero-cinematic relative">
          <HeroLivingBackground />
          <div
            aria-hidden
            className="hero-text-scrim pointer-events-none absolute inset-0 z-[1]"
          />

          <div className="container-page relative z-10 px-4 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <Reveal>
                <span className="badge-pill mb-6 inline-flex items-center gap-2">
                  Segera Hadir
                </span>
              </Reveal>
              <Reveal delay={0.1}>
                <h1 className="page-hero-title text-gradient max-w-3xl">
                  Gabung waitlist Bursa
                </h1>
              </Reveal>
              <Reveal delay={0.18}>
                <p className="section-copy mx-auto mt-5 max-w-xl sm:text-base">
                  Jadi yang pertama tahu saat Bursa dibuka. Tinggalkan email kamu,
                  kami kabari begitu kelas & mentor siap.
                </p>
              </Reveal>
              <Reveal delay={0.26} className="mt-8 w-full max-w-md">
                <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-muted/30" />}>
                  <WaitlistForm />
                </Suspense>
              </Reveal>
              <Reveal delay={0.34} className="mt-10 w-full max-w-md">
                <ul className="flex flex-col gap-2 text-left">
                  {perks.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

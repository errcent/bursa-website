import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Komunitas Trading",
  description:
    "Ruang diskusi mentor dan komunitas terkurasi Bursa — segera hadir. Gabung waitlist untuk kabar peluncuran.",
};

export default function KomunitasPage() {
  return (
    <>
      <Suspense fallback={<div className="h-14 border-b border-border" />}>
        <SiteNavbar />
      </Suspense>
      <main className="flex-1">
        <div className="hero-cinematic page-header-strip">
          <div className="container-page py-16 sm:py-20">
            <p className="eyebrow mb-2">Komunitas</p>
            <h1 className="page-hero-title text-gradient">Segera hadir</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Ruang diskusi mentor dan komunitas terkurasi sedang disiapkan. Gabung waitlist untuk
              mendapat kabar saat fitur ini dibuka.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="btn-primary h-12 rounded-md px-7"
                render={<Link href="/waitlist" />}
              >
                Gabung Waitlist
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-md border-border/70 px-7"
                render={<Link href="/katalog" />}
              >
                Jelajahi Katalog
              </Button>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

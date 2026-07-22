import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { Button } from "@/components/ui/button";
import type { Course } from "@/lib/types";

export function CheckoutUnavailable({ course }: { course: Course }) {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <div className="hero-cinematic page-header-strip border-b border-border/40">
          <div className="container-page py-10 sm:py-12">
            <Link
              href={`/kelas/${course.slug}`}
              className="link-muted mb-5 inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="size-4" />
              Kembali ke detail kelas
            </Link>
            <h1 className="section-title">Checkout</h1>
          </div>
        </div>

        <div className="container-page py-10 sm:py-12">
          <div className="surface-card mx-auto max-w-lg px-6 py-10 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-border/60 bg-muted/30">
              <Clock className="size-6 text-muted-foreground" aria-hidden />
            </div>
            <h2 className="mt-5 font-heading text-lg font-medium">Pembayaran belum dibuka</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Bursa masih dalam tahap preview. Katalog kelas saat ini bersifat demonstrasi —
              checkout akan diumumkan saat peluncuran resmi.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button className="btn-primary" render={<Link href="/waitlist" />}>
                Gabung waitlist platform
              </Button>
              <Button variant="outline" render={<Link href="/katalog" />}>
                Kembali ke katalog
              </Button>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

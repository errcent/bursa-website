import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteNavbar />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="eyebrow">404</p>
        <h1 className="section-display-title mt-3 max-w-lg text-foreground">
          Halaman ini tidak ditemukan.
        </h1>
        <p className="section-copy mx-auto mt-3 max-w-md">
          Tautan mungkin sudah dipindah. Lanjut ke katalog, waitlist, atau pusat bantuan.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button className="btn-primary" render={<Link href="/katalog" />}>
            Lihat Katalog
          </Button>
          <Button variant="outline" render={<Link href="/bantuan" />}>
            Pusat Bantuan
          </Button>
          <Button variant="ghost" render={<Link href="/waitlist" />}>
            Gabung Waitlist
          </Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

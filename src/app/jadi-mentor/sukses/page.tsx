import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, Clock } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Aplikasi Mentor Terkirim",
  description: "Konfirmasi penerimaan aplikasi mentor tahap 1 Bursanalar.",
};

export default async function MentorApplicationSuccessPage() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <div className="hero-cinematic page-header-strip">
          <div className="container-page flex flex-col items-center py-16 text-center sm:py-24">
            <div className="flex size-16 items-center justify-center rounded-full border border-emerald/30 bg-emerald/10 shadow-[0_0_32px_rgba(52,211,153,0.2)]">
              <CheckCircle2 className="size-8 text-emerald" />
            </div>
            <h1 className="mt-6 font-heading text-2xl font-semibold sm:text-3xl">
              Aplikasi tahap 1 terkirim
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Tim kurasi akan meninjau apakah kami mengundangmu ke tahap 2. Konfirmasi juga dikirim
              ke email yang kamu tulis.
            </p>

            <Card className="mt-10 w-full max-w-lg border-border bg-card">
              <CardHeader>
                <CardTitle>Langkah selanjutnya</CardTitle>
                <CardDescription>Screening manusia, biasanya beberapa hari kerja.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 text-left text-sm">
                <div className="flex gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Jika dilanjutkan, kamu menerima tautan privat tahap 2. Bukan wawancara otomatis.
                  </p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald" />
                  <p className="text-muted-foreground">
                    Tahap 2 meminta bukti, sampel mengajar (tautan video), dan pengungkapan konflik.
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  <Button className="flex-1 btn-primary" render={<Link href="/" />}>
                    Kembali ke beranda
                  </Button>
                  <Button variant="outline" className="flex-1" render={<Link href="/katalog" />}>
                    Jelajahi katalog
                  </Button>
                </div>
              </CardContent>
            </Card>

            <p className="mt-6 text-xs text-muted-foreground">
              Pertanyaan? Hubungi{" "}
              <a href="mailto:support@bursanalar.com" className="link-muted">
                support@bursanalar.com
              </a>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, Clock } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { Badge } from "@/components/ui/badge";
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
  description: "Konfirmasi penerimaan aplikasi mentor Bursa Trading Academy.",
};

export default async function MentorApplicationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const applicationId = id ?? "DEMO";

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
              Aplikasi Mentor Berhasil Dikirim
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Terima kasih atas minatmu mengajar di Bursa. Tim kurasi akan meninjau aplikasi dan
              menghubungi via email atau WhatsApp.
            </p>
            <Badge variant="outline" className="mt-4 border-accent/30 bg-accent/10">
              ID Aplikasi: {applicationId}
            </Badge>

            <Card className="mt-10 w-full max-w-lg border-border bg-card">
              <CardHeader>
                <CardTitle>Langkah selanjutnya</CardTitle>
                <CardDescription>Proses review biasanya memakan 3–5 hari kerja.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 text-left text-sm">
                <div className="flex gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Tim kami meninjau kredensial, bio, dan kesesuaian dengan standar edukasi platform.
                  </p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald" />
                  <p className="text-muted-foreground">
                    Jika lolos tahap awal, kamu akan diundang wawancara singkat (30–45 menit) untuk
                    membahas rencana kurikulum.
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  <Button className="flex-1 btn-primary" render={<Link href="/jadi-mentor" />}>
                    Kembali ke halaman mentor
                  </Button>
                  <Button variant="outline" className="flex-1" render={<Link href="/katalog" />}>
                    Jelajahi katalog
                  </Button>
                </div>
              </CardContent>
            </Card>

            <p className="mt-6 text-xs text-muted-foreground">
              Pertanyaan? Hubungi{" "}
              <a href="mailto:mentor@bursa.id" className="link-muted">
                mentor@bursa.id
              </a>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, PlayCircle } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/lib/auth/client";
import { buildLoginHref, buildRegisterHref } from "@/lib/auth/redirect";
import { EXISTING_ACCOUNT_PROMPT } from "@/lib/features/registration-copy";
import { formatRupiah } from "@/lib/mock-data";
import { enrollUser } from "@/lib/video/protection";
import type { Course, Mentor } from "@/lib/types";

export function CheckoutSuccessClient({
  course,
  mentor,
}: {
  course: Course;
  mentor: Mentor;
}) {
  const { session, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const slug = course.slug || searchParams.get("course") || "";
  const successPath = slug ? `/checkout/sukses?course=${encodeURIComponent(slug)}` : "/checkout/sukses";
  const loginHref = buildLoginHref(successPath);

  useEffect(() => {
    const active = session ?? getSession();
    const email = active?.email;
    if (!email || !slug) return;

    if (active?.userId) {
      enrollUser(active.userId, slug);
    }

    void fetch(`/api/courses/${encodeURIComponent(slug)}/enroll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-email": email,
      },
      body: JSON.stringify({
        email,
        userId: active?.userId,
        name: active?.name,
        role: active?.role,
      }),
    }).catch(() => {
      /* network failure, local enroll still unlocks learning UI */
    });
  }, [session, slug]);

  if (!slug) {
    return (
      <>
        <SiteNavbar />
        <main className="flex flex-1 items-center justify-center py-24">
          <p className="text-sm text-muted-foreground">Kelas tidak ditemukan.</p>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!authLoading && !session) {
    return (
      <>
        <SiteNavbar />
        <main className="flex-1">
          <div className="hero-cinematic page-header-strip">
            <div className="container-page flex flex-col items-center py-16 text-center sm:py-24">
              <h1 className="font-heading text-2xl font-medium sm:text-3xl">Pembelian belum dibuka</h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Peluncuran batch pertama belum dimulai. Gabung waitlist untuk kabar tentang{" "}
                <span className="text-foreground/90">{course.title}</span>.
              </p>
              <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
                <Button className="w-full btn-primary" render={<Link href={buildRegisterHref(loginHref)} />}>
                  Gabung waitlist
                </Button>
                <p className="text-sm text-muted-foreground">
                  {EXISTING_ACCOUNT_PROMPT}{" "}
                  <Link href={loginHref} className="link-accent font-medium">
                    Masuk
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const orderId = `BR-${course.slug.slice(0, 12).toUpperCase().replace(/-/g, "")}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <div className="hero-cinematic page-header-strip">
          <div className="container-page flex flex-col items-center py-16 text-center sm:py-24">
            <div className="flex size-16 items-center justify-center rounded-full border border-emerald/30 bg-emerald/10 shadow-[0_0_32px_rgba(52,211,153,0.2)]">
              <CheckCircle2 className="size-8 text-emerald" />
            </div>
            <h1 className="mt-6 text-center font-heading text-2xl font-medium sm:text-3xl">
              Pembayaran Berhasil
            </h1>
            <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
              Akses kelas kamu sudah aktif.
            </p>

            <Card className="surface-card mt-10 w-full max-w-lg overflow-hidden border-0 bg-transparent shadow-none">
              <div className="border-b border-border/60 px-6 py-5 text-left">
                <h2 className="font-heading text-base font-medium">Detail Pesanan</h2>
                <p className="mt-1 text-sm text-muted-foreground">ID pesanan: {orderId}</p>
              </div>
              <CardContent className="flex flex-col gap-4 px-6 py-5">
                <div>
                  <p className="font-heading text-sm font-medium">{course.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Mentor: {mentor.name}</p>
                </div>

                <Separator />

                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total dibayar</span>
                    <span className="font-medium font-mono tabular-nums">
                      {formatRupiah(course.price)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  <Button
                    className="flex-1 btn-primary"
                    render={<Link href={`/belajar/${course.slug}/l1`} />}
                  >
                    <PlayCircle className="size-4" />
                    Mulai Belajar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Link href="/katalog" className="link-muted mt-6">
              Lihat kelas lain di katalog →
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

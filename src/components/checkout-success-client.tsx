"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MessageSquare, PlayCircle } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/lib/auth/client";
import { calculateCheckoutBreakdown } from "@/lib/pricing";
import { formatRupiah, getCourseBySlug, getMentorBySlug } from "@/lib/mock-data";
import { enrollUser } from "@/lib/video/protection";

export function CheckoutSuccessClient({ courseSlug }: { courseSlug: string }) {
  const { session } = useAuth();
  const searchParams = useSearchParams();
  const slug = courseSlug || searchParams.get("course") || "";

  const course = getCourseBySlug(slug);
  const mentor = course ? getMentorBySlug(course.mentorSlug) : undefined;

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
      /* network failure — local enroll still unlocks learning UI */
    });
  }, [session, slug]);

  if (!course || !mentor) {
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

  const breakdown = calculateCheckoutBreakdown(course.price);
  const orderId = `DEMO-${course.slug.slice(0, 12).toUpperCase().replace(/-/g, "")}`;

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
              Simulasi Pembayaran Berhasil
            </h1>
            <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
              Enrollment demo aktif dan hub mentor ditambahkan ke komunitas Anda (jika tersedia).
            </p>
            <Badge
              variant="outline"
              className="mt-4 border-amber-400/30 bg-amber-400/10 text-amber-200"
            >
              Mode Demo
            </Badge>

            <Card className="mt-10 w-full max-w-lg border-border bg-card">
              <CardHeader>
                <CardTitle>Detail Pesanan</CardTitle>
                <CardDescription>ID simulasi: {orderId}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <p className="font-heading text-sm font-medium">{course.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Mentor: {mentor.name}</p>
                </div>

                <Separator />

                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total dibayar</span>
                    <span className="font-medium font-mono tabular-nums">
                      {formatRupiah(breakdown.coursePrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Komisi platform ({breakdown.commissionRatePercent}%)</span>
                    <span>{formatRupiah(breakdown.platformFee)}</span>
                  </div>
                  <div className="flex justify-between text-emerald">
                    <span>Mentor menerima</span>
                    <span>{formatRupiah(breakdown.mentorPayout)}</span>
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
                  <Button
                    variant="outline"
                    className="flex-1"
                    render={<Link href="/komunitas" />}
                  >
                    <MessageSquare className="size-4" />
                    Buka komunitas
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

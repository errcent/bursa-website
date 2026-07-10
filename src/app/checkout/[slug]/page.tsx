import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { CheckoutForm } from "@/components/checkout-form";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { courses, getCourseBySlug, getMentorBySlug } from "@/lib/mock-data";
import { PLATFORM_COMMISSION_RATE } from "@/lib/pricing";

export function generateStaticParams() {
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) return {};
  return {
    title: `Checkout — ${course.title}`,
    description: "Simulasi pembayaran ke mentor untuk akses kelas/paket belajar (mode demo).",
  };
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  const mentor = getMentorBySlug(course.mentorSlug);
  if (!mentor) notFound();

  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <div className="hero-cinematic page-header-strip">
          <div className="container-page py-10">
            <Link
              href={`/kelas/${course.slug}`}
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Kembali ke detail kelas
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-2xl font-medium sm:text-3xl">Checkout</h1>
              <Badge variant="outline" className="border-amber-400/30 bg-amber-400/10 text-amber-200">
                Simulasi — Tanpa Pembayaran Real
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Murid membayar langsung ke mentor (bukan per modul). Platform mengambil komisi{" "}
              <span className="text-foreground/80">{PLATFORM_COMMISSION_RATE * 100}%</span> per
              transaksi untuk infrastruktur & verifikasi.
            </p>
          </div>
        </div>

        <div className="container-page py-10">
          <CheckoutForm course={course} mentor={mentor} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

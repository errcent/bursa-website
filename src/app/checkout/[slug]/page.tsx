import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { CheckoutForm } from "@/components/checkout-form";
import { CheckoutUnavailable } from "@/components/checkout-unavailable";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import {
  getCatalogCourseSlugs,
  getCourseBySlug,
  getMentorBySlug,
} from "@/lib/catalog/server";
import { canPurchaseCourse } from "@/lib/catalog/payment-gate";

export async function generateStaticParams() {
  const slugs = await getCatalogCourseSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return {};
  return {
    title: `Checkout — ${course.title}`,
    description: `Selesaikan pembelian akses kelas ${course.title} di Bursa Trading Academy.`,
  };
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const mentor = await getMentorBySlug(course.mentorSlug);
  if (!mentor) notFound();

  if (!canPurchaseCourse(course.price)) {
    return <CheckoutUnavailable course={course} />;
  }

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
            <p className="section-copy mt-3 max-w-2xl">
              Pembayaran sekali untuk akses kelas selamanya. Total yang ditampilkan adalah jumlah
              yang kamu bayar ke mentor melalui platform.
            </p>
          </div>
        </div>

        <div className="container-page py-10 sm:py-12">
          <CheckoutForm course={course} mentor={mentor} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

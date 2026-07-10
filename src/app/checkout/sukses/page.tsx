import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { CheckoutSuccessClient } from "@/components/checkout-success-client";
import { getCourseBySlug } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Pembayaran Berhasil (Simulasi)",
  description: "Konfirmasi simulasi pembayaran ke mentor untuk kelas/paket belajar.",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course: courseSlug } = await searchParams;
  if (!courseSlug || !getCourseBySlug(courseSlug)) notFound();

  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center py-24" />}>
      <CheckoutSuccessClient courseSlug={courseSlug} />
    </Suspense>
  );
}

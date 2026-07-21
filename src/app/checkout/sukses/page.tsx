import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { CheckoutSuccessClient } from "@/components/checkout-success-client";
import { getCourseBySlug, getMentorBySlug } from "@/lib/catalog/server";
import type { Course, Mentor } from "@/lib/types";

export const metadata: Metadata = {
  title: "Pembayaran Berhasil",
  description: "Konfirmasi pembayaran ke mentor untuk kelas atau paket belajar.",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course: courseSlug } = await searchParams;
  if (!courseSlug) notFound();

  const course = await getCourseBySlug(courseSlug);
  if (!course) notFound();

  const mentor = await getMentorBySlug(course.mentorSlug);
  if (!mentor) notFound();

  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center py-24" />}>
      <CheckoutSuccessClient course={course} mentor={mentor} />
    </Suspense>
  );
}

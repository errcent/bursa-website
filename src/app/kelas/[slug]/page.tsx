import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, ShieldCheck } from "lucide-react";

import { CourseDetailHero } from "@/components/course-detail-hero";
import { CourseDetailCheckoutPanel } from "@/components/course-detail-checkout-sidebar";
import { CourseInstructorSection } from "@/components/course-instructor-section";
import { CourseCurriculumCards } from "@/components/course-curriculum-cards";
import { CourseReviewsSection } from "@/components/course-reviews-section";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  getCatalogCourseSlugs,
  getCourseBySlug,
  getCourseReviews,
  getMentorBySlug,
} from "@/lib/catalog/server";
import { formatRupiah } from "@/lib/mock-data";

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
  return { title: course.title, description: course.shortDescription };
}

const faqs = [
  {
    question: "Berapa lama akses ke kelas ini?",
    answer:
      "Akses berlaku selamanya (lifetime access) sejak tanggal pembelian, termasuk pembaruan materi di masa depan.",
  },
  {
    question: "Apakah cocok untuk pemula total?",
    answer:
      "Lihat badge level di atas — setiap kelas dirancang untuk level pengalaman tertentu agar hasil belajarnya optimal.",
  },
];

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const [mentor, reviews] = await Promise.all([
    getMentorBySlug(course.mentorSlug),
    getCourseReviews(slug, 4),
  ]);
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const primaryCheckoutHref = `/checkout/${course.slug}`;
  const priceLabel = formatRupiah(course.price);

  return (
    <>
      <div className="hidden md:block">
        <SiteNavbar />
      </div>
      <main className="flex-1 overflow-x-hidden bg-background">
        <CourseDetailHero
          course={course}
          mentor={mentor ?? null}
          previewHref={`/belajar/${course.slug}/l1`}
        />

        <section className="border-t border-border/40 bg-black">
          <div className="container-page min-w-0 py-10 sm:py-14">
            <CourseCurriculumCards course={course} />
          </div>
        </section>

        <div className="container-page min-w-0 py-12 sm:py-16">
          <div className="mx-auto flex max-w-3xl flex-col gap-12 sm:gap-14">
            {mentor && <CourseInstructorSection mentor={mentor} />}

            <section>
              <h2 className="section-title mb-5">Setelah kelas ini, kamu akan bisa</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {course.outcomes.map((outcome) => (
                  <li
                    key={outcome}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald" />
                    {outcome}
                  </li>
                ))}
              </ul>
            </section>

            {reviews.length > 0 && (
              <CourseReviewsSection
                reviews={reviews}
                rating={course.rating}
                ratingCount={course.ratingCount}
              />
            )}

            <section className="flex min-w-0 gap-4 rounded-xl border border-border bg-card p-5 sm:p-6">
              <ShieldCheck className="size-5 shrink-0 text-emerald" />
              <div className="min-w-0">
                <h3 className="font-heading text-sm font-medium text-foreground">
                  Transparansi & Pengingat Risiko
                </h3>
                <p className="mt-2 break-words text-sm leading-relaxed text-muted-foreground">
                  Kelas ini berfokus pada edukasi konsep dan metodologi analisis{" "}
                  {course.instrument.toLowerCase()}, bukan rekomendasi/ajakan beli-jual instrumen
                  tertentu. Seluruh keputusan transaksi tetap ada di tangan masing-masing peserta.
                </p>
              </div>
            </section>

            <section>
              <h2 className="section-title mb-5">Pertanyaan Umum</h2>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <Accordion>
                  {faqs.map((faq, i) => (
                    <AccordionItem
                      key={faq.question}
                      value={`faq-${i}`}
                      className="border-border/60 px-4 last:border-b-0 sm:px-5"
                    >
                      <AccordionTrigger className="faq-accordion-trigger">
                        <span className="min-w-0 break-words pr-2 text-left">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </section>
          </div>
        </div>

        <CourseDetailCheckoutPanel
          course={course}
          priceLabel={priceLabel}
          checkoutHref={primaryCheckoutHref}
          previewHref={`/belajar/${course.slug}/l1`}
          totalLessons={totalLessons}
        />
      </main>
      <SiteFooter />
    </>
  );
}

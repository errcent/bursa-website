import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, ShieldCheck } from "lucide-react";

import { CourseDetailHero } from "@/components/course-detail-hero";
import { CourseCurriculumCards } from "@/components/course-curriculum-cards";
import { CourseDetailMobileCheckout } from "@/components/course-detail-mobile-checkout";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { CourseReviewsSection } from "@/components/course-reviews-section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  getCatalogCourseSlugs,
  getCourseBySlug,
  getMentorBySlug,
} from "@/lib/catalog/server";
import { formatRupiah } from "@/lib/mock-data";
import { hasRating } from "@/lib/utils";

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
    answer: "Akses berlaku selamanya (lifetime access) sejak tanggal pembelian, termasuk pembaruan materi di masa depan.",
  },
  {
    question: "Kapan saya bisa memberi rating & ulasan?",
    answer:
      "Setelah kamu menyelesaikan minimal satu modul penuh (semua lesson di modul tersebut). Aturan ini menjaga ulasan tetap berasal dari murid yang benar-benar belajar, bukan review palsu.",
  },
  {
    question: "Apakah cocok untuk pemula total?",
    answer: "Lihat badge level di atas — setiap kelas dirancang untuk level pengalaman tertentu agar hasil belajarnya optimal.",
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

  const mentor = await getMentorBySlug(course.mentorSlug);
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const primaryCheckoutHref = `/checkout/${course.slug}`;

  return (
    <>
      <SiteNavbar />
      <main className="flex-1 overflow-x-hidden bg-background pb-24 sm:pb-0">
        <CourseDetailHero
          course={course}
          mentor={mentor ?? null}
          totalLessons={totalLessons}
          priceLabel={formatRupiah(course.price)}
          checkoutHref={primaryCheckoutHref}
          previewHref={`/belajar/${course.slug}/l1`}
          ratingLabel={hasRating(course.rating) ? `${course.rating}` : ""}
        />

        <div className="container-page min-w-0 py-12 sm:py-16">
          <section className="mb-14">
            <h2 className="mb-6 font-heading text-xl font-medium sm:text-2xl">Isi Kelas</h2>
            <CourseCurriculumCards course={course} />
          </section>

          <div className="grid min-w-0 gap-10 lg:grid-cols-[2fr_1fr]">
            <div className="flex min-w-0 flex-col gap-10">
              <section>
                <h2 className="section-title mb-4">Setelah kelas ini, kamu akan bisa</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {course.outcomes.map((outcome) => (
                    <li key={outcome} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald" />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="flex min-w-0 gap-3 rounded-xl border border-emerald/20 bg-emerald/5 p-5">
                <ShieldCheck className="size-5 shrink-0 text-emerald" />
                <div className="min-w-0">
                  <h3 className="text-sm font-medium">Transparansi & Pengingat Risiko</h3>
                  <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">
                    Kelas ini berfokus pada edukasi konsep dan metodologi analisis
                    {" "}{course.instrument.toLowerCase()}, bukan rekomendasi/ajakan beli-jual instrumen
                    tertentu. Seluruh keputusan transaksi tetap ada di tangan masing-masing peserta.
                  </p>
                </div>
              </section>

              <section id="ulasan">
                <h2 className="section-title mb-4">Rating & Ulasan</h2>
                <CourseReviewsSection courseSlug={course.slug} />
              </section>

              <section>
                <h2 className="section-title mb-4">Pertanyaan Umum</h2>
                <div className="surface-card p-2">
                  <Accordion>
                    {faqs.map((faq, i) => (
                      <AccordionItem key={faq.question} value={`faq-${i}`} className="px-3">
                        <AccordionTrigger className="faq-accordion-trigger">
                          <span className="min-w-0 break-words pr-2 text-left">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </section>
            </div>

            {mentor && (
              <aside className="min-w-0">
                <div className="surface-card sticky top-24 p-5">
                  <h3 className="text-sm font-medium text-muted-foreground">Tentang Mentor</h3>
                  <div className="mt-3 flex items-center gap-3">
                    <Avatar className="size-14">
                      {mentor.avatarUrl ? (
                        <AvatarImage
                          src={mentor.avatarUrl}
                          alt={`Foto ${mentor.name}`}
                          className="object-cover object-top"
                        />
                      ) : null}
                      <AvatarFallback className="bg-surface-2">{mentor.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{mentor.name}</p>
                      <p className="text-xs text-muted-foreground">{mentor.title}</p>
                    </div>
                  </div>
                  <p className="mt-3 break-words text-sm text-muted-foreground">{mentor.bio}</p>
                  <Button variant="outline" className="mt-4 w-full" render={<Link href={`/instruktur/${mentor.slug}`} />}>
                    Lihat Profil Lengkap
                  </Button>
                </div>
              </aside>
            )}
          </div>
        </div>

        <CourseDetailMobileCheckout
          courseSlug={course.slug}
          priceLabel={formatRupiah(course.price)}
          checkoutHref={primaryCheckoutHref}
        />
      </main>
      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, PlayCircle, ShieldCheck } from "lucide-react";

import { CourseDetailHero } from "@/components/course-detail-hero";
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
import { courses, formatRupiah, getCourseBySlug, getMentorBySlug } from "@/lib/mock-data";

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
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  const mentor = getMentorBySlug(course.mentorSlug);
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const primaryCheckoutHref = `/checkout/${course.slug}`;

  return (
    <>
      <SiteNavbar />
      <main className="flex-1 pb-24 sm:pb-0">
        <div className="hero-cinematic page-header-strip">
          <CourseDetailHero
            course={course}
            mentor={mentor ?? null}
            totalLessons={totalLessons}
            priceLabel={formatRupiah(course.price)}
            checkoutHref={primaryCheckoutHref}
            previewHref={`/belajar/${course.slug}/l1`}
            ratingLabel={`${course.rating}`}
          />
        </div>

        <div className="container-page grid gap-10 py-14 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-10">
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

            <section>
              <h2 className="section-title mb-4">Kurikulum</h2>
              <div className="surface-card p-2">
                <Accordion defaultValue={["module-0"]}>
                  {course.modules.map((module, mi) => (
                    <AccordionItem key={module.title} value={`module-${mi}`} className="px-3">
                      <AccordionTrigger>
                        <span>
                          {module.title}{" "}
                          <span className="font-normal text-muted-foreground">
                            ({module.lessons.length} lesson)
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="flex flex-col gap-2">
                          {module.lessons.map((lesson) => (
                            <li key={lesson.id}>
                              <Link
                                href={`/belajar/${course.slug}/${lesson.id}`}
                                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <PlayCircle className="size-4 shrink-0" />
                                  <span className="truncate">{lesson.title}</span>
                                  {lesson.preview && (
                                    <span className="shrink-0 rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-medium text-emerald">
                                      Preview Gratis
                                    </span>
                                  )}
                                </span>
                                <span className="ml-3 shrink-0 text-xs">{lesson.durationMinutes} menit</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </section>

            <section className="flex gap-3 rounded-xl border border-emerald/20 bg-emerald/5 p-5">
              <ShieldCheck className="size-5 shrink-0 text-emerald" />
              <div>
                <h3 className="text-sm font-medium">Transparansi & Pengingat Risiko</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
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
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </section>
          </div>

          {mentor && (
            <aside>
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
                <p className="mt-3 text-sm text-muted-foreground">{mentor.bio}</p>
                <p className="mt-3 rounded-lg border border-border bg-surface/50 p-3 text-xs text-muted-foreground">
                  Konten kelas dari mentor tampil setelah proses review tim internal untuk menjaga
                  kualitas katalog.
                </p>
                <Button variant="outline" className="mt-4 w-full" render={<Link href={`/instruktur/${mentor.slug}`} />}>
                  Lihat Profil Lengkap
                </Button>
              </div>
            </aside>
          )}
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

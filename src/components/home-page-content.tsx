"use client";

import Link from "next/link";
import { ArrowLeftRight, ArrowRight, Bitcoin, LineChart } from "lucide-react";
import { motion } from "motion/react";

import { CourseCarousel } from "@/components/course-carousel";
import { CurriculumPreviewSection } from "@/components/home/curriculum-preview-section";
import { ClosingCtaSection } from "@/components/home/closing-cta-section";
import { PricingModelComparison } from "@/components/home/pricing-model-comparison";
import { HeroLivingBackground } from "@/components/hero-living-bg";
import { HeroTyping } from "@/components/motion/hero-typing";
import { MentorLandingSection } from "@/components/mentor-landing-section";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { HomeFaqSection } from "@/components/home/home-faq-section";
import { TestimonialShowcase } from "@/components/testimonial-showcase";
import { Button } from "@/components/ui/button";
import { Reveal, RevealText, Stagger, StaggerItem } from "@/components/motion/reveal";
import { reviews } from "@/lib/mock-data";
import type { Course, Mentor } from "@/lib/types";

const instruments = [
  { name: "Saham", href: "/katalog", icon: LineChart },
  { name: "Crypto", href: "/katalog", icon: Bitcoin },
  { name: "Forex", href: "/katalog", icon: ArrowLeftRight },
] as const;

/** Scroll to #kelas-unggulan; explicit offset so repeat clicks still work when the section is partially in view. */
function scrollToPopularClasses() {
  const el = document.getElementById("kelas-unggulan");
  if (!el) return;
  const navOffset = 96; // matches scroll-mt-24
  const top = el.getBoundingClientRect().top + window.scrollY - navOffset;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

const proofPoints = [
  {
    step: "01",
    title: "Pilih instrumen dan level",
    description: "Sesuaikan dengan pengalamanmu: saham, crypto, atau forex.",
  },
  {
    step: "02",
    title: "Ikuti modul berurutan",
    description: "Belajar langkah demi langkah dengan urutan materi yang jelas.",
  },
  {
    step: "03",
    title: "Bayar per kelas",
    description: "Kamu bayar hanya kelas yang dipilih. Tanpa biaya langganan bulanan.",
  },
];

export function HomePageContent({
  courses,
  mentors,
  curriculumCourse,
  curriculumMentor,
}: {
  courses: Course[];
  mentors: Mentor[];
  curriculumCourse?: Course | null;
  curriculumMentor?: Mentor | null;
}) {
  const featuredCourses = [...courses]
    .sort((a, b) => b.studentsCount - a.studentsCount)
    .slice(0, 6);

  const totalStudents = courses.reduce((sum, course) => sum + course.studentsCount, 0);
  const heroBadgeText = "Platform Belajar Trading #1 di Indonesia";

  return (
    <>
      <SiteNavbar />
      <main className="has-mobile-sticky-cta flex-1 overflow-x-clip">
        {/* Hero — single-column, content-proportional height */}
        <section className="hero-cinematic relative border-b border-border/60">
          <HeroLivingBackground />

          <div className="container-page relative z-10 px-4 py-16 sm:px-8 sm:py-20 lg:py-24">
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center lg:mx-0 lg:items-start lg:text-left">
              <RevealText delay={0.05}>
                <span className="badge-pill mb-6 inline-flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-accent" aria-hidden />
                  <HeroTyping text={heroBadgeText} />
                </span>
              </RevealText>
              <RevealText delay={0.12}>
                <h1 className="page-hero-title text-gradient mx-auto max-w-4xl lg:mx-0">
                  Belajar trading bareng mentor terverifikasi
                </h1>
              </RevealText>
              <RevealText delay={0.22}>
                <p className="section-copy mx-auto mt-5 max-w-xl sm:text-base lg:mx-0">
                  Pilih kelas saham, crypto, atau forex sesuai levelmu.
                  Materi terstruktur, bayar per kelas tanpa langganan.
                </p>
              </RevealText>
              <RevealText delay={0.32}>
                <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                  <motion.div className="w-full sm:w-auto" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="lg"
                      className="btn-primary h-12 w-full rounded-full px-8 sm:w-auto"
                      render={<Link href="/katalog" />}
                    >
                      Lihat Katalog
                      <ArrowRight className="size-4" />
                    </Button>
                  </motion.div>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-full rounded-full border-border/70 bg-card/40 px-7 text-sm sm:h-11 sm:w-auto"
                    onClick={scrollToPopularClasses}
                  >
                    Lihat kelas populer dulu
                  </Button>
                </div>
              </RevealText>

              {/* Instrument pills — static, wrapped; no auto-scrolling marquee */}
              <Reveal delay={0.45} className="mt-10 w-full sm:mt-14">
                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 lg:justify-start">
                  {instruments.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="logo-strip-item inline-flex items-center gap-2"
                      >
                        <Icon className="size-4" strokeWidth={1.5} />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Course carousel — featured from catalog */}
        <section
          id="kelas-unggulan"
          className="section-tight scroll-mt-24 border-b border-border/60"
        >
          <div className="container-page">
            <CourseCarousel courses={featuredCourses} totalStudents={totalStudents} />
          </div>
        </section>

        {/* How it works — absorbs pricing transparency (pay-per-class, no subscription) */}
        <section className="section-muted section-tight border-b border-border/60">
          <div className="container-page">
            <Reveal className="mb-10 max-w-2xl">
              <p className="eyebrow mb-3">Alur belajar</p>
              <h2 className="section-title sm:text-3xl">Tiga langkah belajar di Bursa</h2>
              <p className="section-copy mt-2">
                Pilih kelas, ikuti modul, lalu bayar sekali.
              </p>
            </Reveal>
            <Stagger className="grid gap-3.5 sm:gap-4 md:grid-cols-3">
              {proofPoints.map((item) => (
                <StaggerItem key={item.step}>
                  <motion.div className="landing-proof-card surface-card h-full p-4 sm:p-6" whileHover={{ y: -2 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
                    <p className="font-mono text-xs text-accent/70">{item.step}</p>
                    <h3 className="mt-2 font-heading text-base font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </motion.div>
                </StaggerItem>
              ))}
            </Stagger>

            <PricingModelComparison />
          </div>
        </section>

        {/* Mentor terverifikasi — trust, stats, group photo */}
        <section className="section-loose border-b border-border/60">
          <div className="container-page">
            <MentorLandingSection mentors={mentors} courses={courses} />
          </div>
        </section>

        {/* Curriculum preview — sample module/syllabus snippet */}
        <CurriculumPreviewSection course={curriculumCourse ?? null} mentor={curriculumMentor ?? null} />

        {/* Testimonials */}
        <TestimonialShowcase reviews={reviews} />

        {/* FAQ */}
        <HomeFaqSection />

        {/* Single closing CTA */}
        <ClosingCtaSection />
      </main>
      <SiteFooter />
    </>
  );
}

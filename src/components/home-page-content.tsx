"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  Bitcoin,
  Check,
  LineChart,
} from "lucide-react";
import { motion } from "motion/react";

import { CourseCarousel } from "@/components/course-carousel";
import { HeroLivingBackground } from "@/components/hero-living-bg";
import { HeroTyping } from "@/components/motion/hero-typing";
import { MentorCarousel } from "@/components/mentor-carousel";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import {
  NarrativeClosingCta,
  NarrativeScrollSections,
} from "@/components/narrative-scroll-sections";
import { TestimonialShowcase } from "@/components/testimonial-showcase";
import { Button } from "@/components/ui/button";
import { Reveal, RevealText, Stagger, StaggerItem } from "@/components/motion/reveal";
import { courses, featuredFounderResponse, mentors, reviews } from "@/lib/mock-data";

const instruments = [
  { name: "Saham", href: "/katalog?instrumen=Saham", icon: LineChart },
  { name: "Crypto", href: "/katalog?instrumen=Crypto", icon: Bitcoin },
  { name: "Forex", href: "/katalog?instrumen=Forex", icon: ArrowLeftRight },
] as const;

const paths = [
  {
    title: "Mulai dari topik",
    description:
      "Pilih instrumen dan level dulu. Lalu lihat kelas yang paling relevan untuk target belajarmu.",
    href: "/katalog",
    cta: "Buka katalog kelas",
    tone: "primary",
  },
  {
    title: "Mulai dari mentor",
    description:
      "Lihat profil dan spesialisasi mentor. Pilih kelas dari pengajar yang paling cocok dengan tujuan belajarmu.",
    href: "/katalog?view=instruktur",
    cta: "Buka katalog mentor",
    tone: "secondary",
  },
];

function scrollToPopularClasses() {
  document.getElementById("kelas-unggulan")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
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

export function HomePageContent() {
  const featuredCourses = [...courses]
    .sort((a, b) => b.studentsCount - a.studentsCount)
    .slice(0, 6);

  return (
    <>
      <SiteNavbar />
      <main className="has-mobile-sticky-cta flex-1 overflow-x-hidden">
        {/* Hero — AtomAI centered layout */}
        <section className="hero-cinematic relative min-h-[min(74vh,720px)] border-b border-border/60 sm:min-h-[84vh]">
          <HeroLivingBackground />

          <div className="container-page relative z-10 flex min-h-[min(74vh,720px)] flex-col items-center justify-center px-4 pb-12 pt-20 text-center sm:min-h-[84vh] sm:px-8 sm:pb-16 sm:pt-28">
            <RevealText delay={0.05}>
              <span className="badge-pill mb-6 inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-accent" aria-hidden />
                <HeroTyping text="Platform edukasi trading #1 di Indonesia" />
              </span>
            </RevealText>
            <RevealText delay={0.12}>
              <h1 className="page-hero-title text-gradient mx-auto max-w-4xl">
                Belajar trading bareng mentor terverifikasi
              </h1>
            </RevealText>
            <RevealText delay={0.22}>
              <p className="section-copy mx-auto mt-5 max-w-xl sm:text-base">
                Pilih kelas saham, crypto, atau forex sesuai levelmu.
                Materi terstruktur, bayar per kelas tanpa langganan.
              </p>
            </RevealText>
            <RevealText delay={0.32}>
              <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
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

            {/* Instrument strip — marquee on mobile, centered row on desktop */}
            <Reveal delay={0.45} className="mt-10 w-full max-w-2xl sm:mt-14">
              <div className="logo-marquee md:hidden">
                <div className="logo-marquee-track gap-8 px-4">
                  {[...instruments, ...instruments].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={`${item.name}-${i}`}
                        href={item.href}
                        className="logo-strip-item inline-flex shrink-0 items-center gap-2 whitespace-nowrap"
                      >
                        <Icon className="size-4" strokeWidth={1.5} />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
              <div className="hidden flex-wrap items-center justify-center gap-x-10 gap-y-3 md:flex">
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
        </section>

        {/* Course carousel — featured from mock-data */}
        <section
          id="kelas-unggulan"
          className="section-tight scroll-mt-24 border-b border-border/60"
        >
          <div className="container-page">
            <CourseCarousel courses={featuredCourses} />
          </div>
        </section>

        {/* Scroll narrative — trust story as vertical sections */}
        <NarrativeScrollSections />

        {/* Two paths */}
        <section className="section-spacious border-b border-border/60">
          <div className="container-page">
            <Reveal className="mb-10 max-w-2xl">
              <p className="eyebrow mb-3">Rute belajar</p>
              <h2 className="section-title sm:text-3xl">Pilih cara masuk ke katalog</h2>
              <p className="section-copy mt-2">
                Bisa mulai dari topik atau dari mentor. Hasilnya tetap: kelas yang paling pas untukmu.
              </p>
            </Reveal>
            <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
              {paths.map((path) => (
                <StaggerItem key={path.title}>
                  <motion.div
                    className={
                      path.tone === "primary"
                        ? "landing-path-card surface-card-hover flex h-full flex-col border-accent/25 bg-accent-soft/35 p-4 sm:gap-4 sm:p-8"
                        : "landing-path-card surface-card-hover flex h-full flex-col p-4 sm:gap-4 sm:p-8"
                    }
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Check className={path.tone === "primary" ? "size-5 text-accent" : "size-5 text-accent/75"} />
                    <h3 className="font-heading text-lg font-semibold sm:text-xl">{path.title}</h3>
                    <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                      {path.description}
                    </p>
                    <Link
                      href={path.href}
                      className={
                        path.tone === "primary"
                          ? "inline-flex w-fit items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/85"
                          : "link-accent inline-flex w-fit items-center gap-1 text-sm"
                      }
                    >
                      {path.cta}
                      <ArrowRight className="size-4" />
                    </Link>
                  </motion.div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* How it works */}
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
          </div>
        </section>

        {/* Mentors */}
        <section className="section-loose border-b border-border/60">
          <div className="container-page">
            <MentorCarousel mentors={mentors} />
          </div>
        </section>

        {/* Testimonials + founder response */}
        <TestimonialShowcase reviews={reviews} founderResponse={featuredFounderResponse} />

        {/* Closing CTA */}
        <NarrativeClosingCta />

        {/* Disclaimer */}
        <section className="border-t border-border/60">
          <div className="container-page py-9 sm:py-10">
            <Reveal>
              <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-muted-foreground/90">
                Bursa adalah platform edukasi, bukan broker atau aplikasi eksekusi trading.
                Materi membantu kamu memahami riset dan manajemen risiko. Keputusan investasi
                sepenuhnya ada pada kamu, dan trading tetap berisiko kehilangan modal.
              </p>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

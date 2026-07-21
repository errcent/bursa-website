"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { Reveal } from "@/components/motion/reveal";
import { WordReveal } from "@/components/motion/word-reveal";
import { Button } from "@/components/ui/button";

/** The single closing CTA of the landing page — waitlist-focused close. */
export function ClosingCtaSection() {
  const { session, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showMemberExperience = mounted && !isLoading && Boolean(session);

  const eyebrow = showMemberExperience ? "Sudah terdaftar" : "Segera hadir";
  const headline = showMemberExperience
    ? "Lanjutkan perjalanan belajarmu"
    : "Gabung waitlist Bursa";
  const body = showMemberExperience
    ? "Akses dashboard untuk melanjutkan progres kelas dan materi yang sudah kamu mulai."
    : "Jadi yang pertama tahu saat Bursa dibuka. Tinggalkan email — kami kabari begitu kelas dan mentor siap.";
  const footnote = showMemberExperience
    ? "Progres belajar tersimpan di akun kamu."
    : "Gratis masuk waitlist. Tanpa spam — hanya kabar penting.";

  return (
    <section className="section-closing relative overflow-hidden py-16 sm:py-20 md:py-24">
      <div className="section-closing__glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="container-page relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="eyebrow mb-3">{eyebrow}</p>
          </Reveal>
          <WordReveal
            as="h2"
            className="section-title sm:text-3xl md:text-4xl"
            text={headline}
            trigger="inView"
            delay={0.04}
          />
          <Reveal delay={0.1} className="mt-4">
            <p className="section-copy mx-auto max-w-lg">{body}</p>

            <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:mx-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
              <motion.div className="w-full sm:w-auto" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="btn-primary h-12 w-full rounded-full px-8 sm:w-auto"
                  render={<Link href={showMemberExperience ? "/dashboard" : "/waitlist"} />}
                >
                  {showMemberExperience ? "Lanjut Belajar" : "Gabung Waitlist"}
                  <ArrowRight className="size-4" />
                </Button>
              </motion.div>
              {!showMemberExperience ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-full border-border/70 bg-card/40 px-7 text-sm"
                  render={<Link href="/katalog" />}
                >
                  Lihat preview kelas
                </Button>
              ) : null}
            </div>

            <p className="mt-6 font-mono text-[10px] text-muted-foreground/60">{footnote}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

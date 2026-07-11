"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

import { useAuth } from "@/components/auth-provider";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

/** The single closing CTA of the landing page — replaces the old narrative CTA + footer CTA band. */
export function ClosingCtaSection() {
  const { session, isLoading } = useAuth();
  const isMember = Boolean(session);

  return (
    <section className="relative overflow-hidden border-b border-border/60 py-16 sm:py-20 md:py-24">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 100%, var(--glow), transparent 70%)",
        }}
      />
      <div className="container-page relative z-10">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-3">Siap mulai?</p>
          <h2 className="section-title sm:text-3xl md:text-4xl">
            Temukan kelas yang cocok di katalog
          </h2>
          <p className="section-copy mx-auto mt-4 max-w-lg">
            {isMember
              ? "Bandingkan kurikulum, level, dan profil mentor. Lanjutkan belajar dari dashboard kamu."
              : "Bandingkan kurikulum, level, dan profil mentor. Daftar gratis untuk simpan progres belajar."}
          </p>

          <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:mx-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
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
            {!isLoading && !isMember ? (
              <Button
                size="lg"
                variant="outline"
                className="h-11 rounded-full border-border/70 bg-card/40 px-7 text-sm"
                render={<Link href="/daftar" />}
              >
                Daftar gratis
              </Button>
            ) : null}
            {!isLoading && isMember ? (
              <Button
                size="lg"
                variant="outline"
                className="h-11 rounded-full border-border/70 bg-card/40 px-7 text-sm"
                render={<Link href="/dashboard" />}
              >
                Lanjut Belajar
              </Button>
            ) : null}
          </div>

          <p className="mt-6 font-mono text-[10px] text-muted-foreground/60">
            Bayar hanya saat ambil kelas. Tanpa langganan.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

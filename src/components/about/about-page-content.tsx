"use client";

import Link from "next/link";
import {
  Ban,
  Layers,
  ShieldCheck,
  Users,
  Video,
  Wallet,
} from "lucide-react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  aboutIntro,
  aboutMissionVision,
  aboutPillars,
  aboutWhyUse,
} from "@/lib/about/content";

const iconMap = {
  shield: ShieldCheck,
  layers: Layers,
  wallet: Wallet,
  users: Users,
  video: Video,
  ban: Ban,
} as const;

export function AboutPageContent() {
  return (
    <div className="container-page section-spacious">
      <section>
        <Reveal>
          <p className="eyebrow mb-2">Platform</p>
          <h2 className="section-title">{aboutIntro.title}</h2>
        </Reveal>

        <Reveal delay={0.08} className="mt-6 max-w-3xl space-y-4">
          {aboutIntro.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="section-copy text-foreground/85">
              {paragraph}
            </p>
          ))}
        </Reveal>

        <Reveal delay={0.12} className="mt-8">
          <div className="border-l-2 border-foreground/25 py-1 pl-4 sm:pl-5">
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
              <span className="font-medium text-foreground">Penting:</span> Materi di Bursa
              bersifat edukasi, bukan rekomendasi investasi. Trading dan investasi mengandung
              risiko kerugian modal, keputusan sepenuhnya tanggung jawab pengguna.
            </p>
          </div>
        </Reveal>
      </section>

      <Separator className="my-14 opacity-60" />

      <section>
        <Reveal>
          <p className="eyebrow mb-2">Arah kami</p>
          <h2 className="section-title">Misi & Visi</h2>
          <p className="section-copy mt-2 max-w-2xl">
            Prinsip yang memandu setiap keputusan produk, kurasi mentor, dan pengalaman belajar di
            Bursa.
          </p>
        </Reveal>

        <Stagger className="mt-8 grid gap-8 sm:grid-cols-2 sm:gap-10">
          {[aboutMissionVision.mission, aboutMissionVision.vision].map((item) => (
            <StaggerItem key={item.title}>
              <div className="flex h-full flex-col gap-3 border-t border-border/70 pt-5">
                <h3 className="font-heading text-lg font-semibold tracking-tight">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <Separator className="my-14 opacity-60" />

      <section>
        <Reveal>
          <p className="eyebrow mb-2">Keuntungan</p>
          <h2 className="section-title">Mengapa belajar di Bursa?</h2>
          <p className="section-copy mt-2 max-w-2xl">
            Dirancang untuk pelajar yang ingin proses belajar trading yang jelas, terpercaya, dan
            tanpa tekanan langganan.
          </p>
        </Reveal>

        <Stagger className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-10">
          {aboutWhyUse.map((benefit) => {
            const Icon = iconMap[benefit.icon] ?? ShieldCheck;
            return (
              <StaggerItem key={benefit.title}>
                <div className="flex h-full flex-col gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-muted/20">
                    <Icon className="size-4 text-foreground/80" />
                  </div>
                  <h3 className="font-heading text-sm font-medium tracking-tight">{benefit.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      <Separator className="my-14 opacity-60" />

      <section>
        <Reveal>
          <p className="eyebrow mb-2">Diferensiasi</p>
          <h2 className="section-title">Tiga pilar kepercayaan</h2>
          <p className="section-copy mt-2 max-w-2xl">
            Fondasi yang membedakan Bursa dari konten edukasi trading pada umumnya.
          </p>
        </Reveal>

        <Stagger className="mt-8 space-y-0 divide-y divide-border/60 border-y border-border/60">
          {aboutPillars.map((pillar) => (
            <StaggerItem key={pillar.step}>
              <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:gap-8 sm:py-6">
                <span className="font-mono text-xs font-medium tracking-wide text-muted-foreground">
                  {pillar.step}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-sm font-medium sm:text-base">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {pillar.description}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <Reveal delay={0.08} className="mt-14 text-center">
        <p className="eyebrow mb-3">Mulai sekarang</p>
        <h2 className="section-title sm:text-3xl">Siap membangun fondasi belajar yang solid?</h2>
        <p className="section-copy mx-auto mt-3 max-w-lg">
          Gabung waitlist untuk kabar peluncuran, atau jelajahi preview katalog kelas dan mentor
          sesuai level serta instrumenmu.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="btn-primary h-12 rounded-md px-8"
            render={<Link href="/waitlist" />}
          >
            Gabung Waitlist
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 rounded-md border-border/70 bg-card/40 px-7"
            render={<Link href="/katalog" />}
          >
            Lihat Katalog
          </Button>
        </div>
      </Reveal>
    </div>
  );
}

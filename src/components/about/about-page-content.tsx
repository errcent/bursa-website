"use client";

import Link from "next/link";
import {
  Ban,
  Layers,
  ShieldCheck,
  Target,
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
          <div className="surface-card border-accent/15 bg-accent-soft/20 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10">
                <Target className="size-5 text-accent" />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
                <span className="font-medium text-foreground">Penting:</span> Materi di Bursa
                bersifat edukasi, bukan rekomendasi investasi. Trading dan investasi mengandung
                risiko kerugian modal — keputusan sepenuhnya tanggung jawab pengguna.
              </p>
            </div>
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

        <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
          {[aboutMissionVision.mission, aboutMissionVision.vision].map((item) => (
            <StaggerItem key={item.title}>
              <div className="surface-card-hover flex h-full flex-col gap-3 p-6">
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

        <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {aboutWhyUse.map((benefit) => {
            const Icon = iconMap[benefit.icon] ?? ShieldCheck;
            return (
              <StaggerItem key={benefit.title}>
                <div className="surface-card-hover flex h-full flex-col gap-3 p-5">
                  <div className="flex size-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10">
                    <Icon className="size-5 text-accent" />
                  </div>
                  <h3 className="font-heading text-sm font-medium">{benefit.title}</h3>
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

        <Stagger className="mt-8 space-y-4">
          {aboutPillars.map((pillar) => (
            <StaggerItem key={pillar.step}>
              <div className="surface-card flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
                <span className="font-mono text-xs font-medium text-accent">{pillar.step}</span>
                <div>
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
          Jelajahi katalog kelas dan mentor, lalu pilih jalur belajar yang sesuai level dan
          instrumenmu.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="btn-primary h-12 rounded-full px-8"
            render={<Link href="/katalog" />}
          >
            Lihat Katalog
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 rounded-full border-border/70 bg-card/40 px-7"
            render={<Link href="/bantuan" />}
          >
            Pusat Bantuan
          </Button>
        </div>
      </Reveal>
    </div>
  );
}

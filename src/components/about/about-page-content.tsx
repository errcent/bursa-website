"use client";

import Link from "next/link";
import { Layers, ShieldCheck, Video } from "lucide-react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  aboutFounders,
  aboutIntro,
  aboutMissionVision,
  aboutPillars,
  aboutWhyUse,
} from "@/lib/about/content";

const iconMap = {
  shield: ShieldCheck,
  layers: Layers,
  video: Video,
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
              <span className="font-medium text-foreground">Catatan:</span> Materi di Bursa
              untuk edukasi, bukan saran investasi. Trading berisiko — keputusan dan risiko ada di
              tanganmu.
            </p>
          </div>
        </Reveal>
      </section>

      <Separator className="my-14 opacity-60" />

      <section>
        <Reveal>
          <p className="eyebrow mb-2">Arah</p>
          <h2 className="section-title">Yang kami bangun</h2>
          <p className="section-copy mt-2 max-w-2xl">
            Dua hal yang memandu produk, kurasi mentor, dan cara kami merancang belajar di Bursa.
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
          <p className="eyebrow mb-2">Bursanalar</p>
          <h2 className="section-title">{aboutFounders.title}</h2>
          <p className="section-copy mt-3 max-w-2xl text-foreground/85">{aboutFounders.body}</p>
        </Reveal>
      </section>

      <Separator className="my-14 opacity-60" />

      <section>
        <Reveal>
          <p className="eyebrow mb-2">Kenapa Bursa</p>
          <h2 className="section-title">Cara kami beda</h2>
          <p className="section-copy mt-2 max-w-2xl">
            Fokusnya sederhana: mentor yang dikurasi, materi yang berurutan, dan pengalaman belajar
            yang rapi.
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
          <p className="eyebrow mb-2">Fondasi</p>
          <h2 className="section-title">Tiga yang kami jaga</h2>
          <p className="section-copy mt-2 max-w-2xl">
            Ini yang membedakan Bursa dari konten trading yang bertebaran di mana-mana.
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
        <p className="eyebrow mb-3">Mulai</p>
        <h2 className="section-title sm:text-3xl">Siap mulai belajar?</h2>
        <p className="section-copy mx-auto mt-3 max-w-lg">
          Gabung waitlist untuk kabar peluncuran, atau lihat dulu katalog kelas dan mentornya.
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

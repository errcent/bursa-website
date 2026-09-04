"use client";

import Link from "next/link";
import { Layers, ListOrdered, ShieldCheck } from "lucide-react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { aboutFocus, aboutIntro, aboutLegal } from "@/lib/about/content";
import { legalEntityCopy } from "@/lib/legal/entity";

const iconMap = {
  shield: ShieldCheck,
  layers: Layers,
  list: ListOrdered,
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
      </section>

      <Separator className="my-14 opacity-60" />

      <section>
        <Reveal>
          <p className="eyebrow mb-2">{aboutLegal.eyebrow}</p>
          <h2 className="section-title">{aboutLegal.title}</h2>
        </Reveal>
        <Reveal delay={0.08} className="mt-6 max-w-3xl">
          <p className="section-copy text-foreground/85">{legalEntityCopy.id.imprintBlock}</p>
        </Reveal>
      </section>

      <Separator className="my-14 opacity-60" />

      <section>
        <Reveal>
          <p className="eyebrow mb-2">Fokus</p>
          <h2 className="section-title">Tiga fokus utama</h2>
          <p className="section-copy mt-2 max-w-2xl">
            Mentor terverifikasi, materi berurutan, dan struktur belajar memiliki bobot yang setara.
          </p>
        </Reveal>

        <Stagger className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-10">
          {aboutFocus.map((item) => {
            const Icon = iconMap[item.icon] ?? ShieldCheck;
            return (
              <StaggerItem key={item.title}>
                <div className="flex h-full flex-col gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-muted/20">
                    <Icon className="size-4 text-foreground/80" />
                  </div>
                  <h3 className="font-heading text-sm font-medium tracking-tight">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      <Reveal delay={0.08} className="mt-14 text-center">
        <p className="eyebrow mb-3">Mulai</p>
        <h2 className="section-title sm:text-3xl">Siap memulai pembelajaran?</h2>
        <p className="section-copy mx-auto mt-3 max-w-lg">
          Bergabung dengan waitlist untuk informasi peluncuran, atau telusuri katalog kelas dan
          mentor.
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

"use client";

import {
  BarChart3,
  MessageSquare,
  ShieldCheck,
  Users,
  Video,
  Wallet,
} from "lucide-react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { mentorBenefits } from "@/lib/mentor-program/content";

const iconMap = {
  wallet: Wallet,
  users: Users,
  shield: ShieldCheck,
  video: Video,
  message: MessageSquare,
  chart: BarChart3,
} as const;

export function MentorBenefitsSection() {
  return (
    <section>
      <Reveal>
        <p className="eyebrow mb-2">Keuntungan</p>
        <h2 className="section-title">Mengapa mengajar di Bursa?</h2>
        <p className="section-copy mt-2 max-w-2xl">
          Fokus pada mengajar, kami yang urus infrastruktur, pembayaran, dan kepercayaan murid.
        </p>
      </Reveal>

      <Stagger className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-10">
        {mentorBenefits.map((benefit) => {
          const Icon = iconMap[benefit.icon as keyof typeof iconMap] ?? ShieldCheck;
          return (
            <StaggerItem key={benefit.title}>
              <div className="flex h-full flex-col gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-muted/20">
                  <Icon className="size-4 text-foreground/80" />
                </div>
                <h3 className="font-heading text-sm font-medium tracking-tight">{benefit.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{benefit.description}</p>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}

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
          Fokus pada mengajar — kami yang urus infrastruktur, pembayaran, dan kepercayaan murid.
        </p>
      </Reveal>

      <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mentorBenefits.map((benefit) => {
          const Icon = iconMap[benefit.icon as keyof typeof iconMap] ?? ShieldCheck;
          return (
            <StaggerItem key={benefit.title}>
              <div className="surface-card-hover flex h-full flex-col gap-3 p-5">
                <div className="flex size-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10">
                  <Icon className="size-5 text-accent" />
                </div>
                <h3 className="font-heading text-sm font-medium">{benefit.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{benefit.description}</p>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}

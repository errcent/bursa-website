"use client";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { mentorProcessSteps } from "@/lib/mentor-program/content";

export function MentorProcessSection() {
  return (
    <section>
      <Reveal>
        <p className="eyebrow mb-2">Alur pendaftaran</p>
        <h2 className="section-title">Dari aplikasi hingga go live</h2>
        <p className="section-copy mt-2 max-w-2xl">
          Proses transparan dengan timeline jelas di setiap tahap.
        </p>
      </Reveal>

      <Stagger className="mt-8 space-y-0 divide-y divide-border/60 border-y border-border/60">
        {mentorProcessSteps.map((step) => (
          <StaggerItem key={step.step}>
            <div className="flex flex-col gap-2 py-5 sm:flex-row sm:items-start sm:gap-8 sm:py-6">
              <span className="font-mono text-xs font-medium tracking-wide text-muted-foreground">
                {step.step}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="font-heading text-sm font-medium sm:text-base">{step.title}</h3>
                  <span className="text-[11px] text-muted-foreground">{step.duration}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

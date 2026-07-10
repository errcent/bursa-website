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

      <Stagger className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mentorProcessSteps.map((step, index) => (
          <StaggerItem key={step.step}>
            <div className="surface-card relative flex h-full flex-col gap-3 p-5">
              {index < mentorProcessSteps.length - 1 && (
                <span className="absolute -right-2 top-8 hidden size-4 rounded-full border border-border bg-background lg:block" />
              )}
              <span className="font-mono text-xs text-muted-foreground">{step.step}</span>
              <h3 className="font-heading text-sm font-medium">{step.title}</h3>
              <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
              <span className="badge-muted w-fit text-[11px]">{step.duration}</span>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

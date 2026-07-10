"use client";

import { Check, Circle } from "lucide-react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { mentorRequirements } from "@/lib/mentor-program/content";

export function MentorRequirementsSection() {
  return (
    <section>
      <Reveal>
        <p className="eyebrow mb-2">Persyaratan</p>
        <h2 className="section-title">Siapa yang cocok jadi mentor?</h2>
        <p className="section-copy mt-2 max-w-2xl">
          Kami mencari praktisi yang serius mengajar — bukan yang hanya menjual mimpi profit.
        </p>
      </Reveal>

      <Stagger className="mt-8 flex flex-col gap-3">
        {mentorRequirements.map((req) => (
          <StaggerItem key={req.title}>
            <div className="surface-card flex gap-4 p-5">
              <div
                className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                  req.required
                    ? "border border-emerald/30 bg-emerald/10"
                    : "border border-border bg-muted/30"
                }`}
              >
                {req.required ? (
                  <Check className="size-3.5 text-emerald" />
                ) : (
                  <Circle className="size-3 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-medium">{req.title}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                      req.required
                        ? "bg-emerald/10 text-emerald"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {req.required ? "Wajib" : "Opsional"}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {req.description}
                </p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

"use client";

import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const DISCLAIMER_COPY =
  "Bursa adalah platform edukasi, bukan broker atau aplikasi eksekusi trading. Materi membantu kamu memahami riset dan manajemen risiko. Keputusan investasi sepenuhnya ada pada kamu, dan trading tetap berisiko kehilangan modal.";

const DISCLAIMER_COPY_COMPACT =
  "Bursa adalah platform edukasi, bukan broker. Trading tetap berisiko kehilangan modal — keputusan sepenuhnya ada pada kamu.";

/**
 * Single source of truth for the platform's risk/compliance disclaimer copy.
 * Rendered once per page (via the shared site footer) instead of scattering
 * variations of the same notice across hero, narrative, and footer sections.
 */
export function RiskDisclaimer({
  variant = "full",
  className,
}: {
  variant?: "full" | "compact";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <p className={cn("max-w-2xl text-xs leading-relaxed text-muted-foreground md:text-right", className)}>
        {DISCLAIMER_COPY_COMPACT}
      </p>
    );
  }

  return (
    <section className={cn("border-t border-border/60", className)}>
      <div className="container-page py-9 sm:py-10">
        <Reveal>
          <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-muted-foreground/90">
            {DISCLAIMER_COPY}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

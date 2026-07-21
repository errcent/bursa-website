"use client";

import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const DISCLAIMER_COPY =
  "Bursa adalah platform edukasi, bukan broker atau aplikasi eksekusi trading. Materi membantu kamu memahami riset dan manajemen risiko. Keputusan investasi sepenuhnya ada pada kamu, dan trading tetap berisiko kehilangan modal.";

const DISCLAIMER_COPY_COMPACT =
  "Segala bentuk trading mengandung risiko kehilangan modal. Bursa tidak bertanggung jawab atas keputusan investasi yang diambil pengguna.";

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
      <p
        className={cn(
          "max-w-[16rem] text-[11px] leading-[1.35] tracking-normal text-muted-foreground/45 sm:max-w-xs md:max-w-sm md:text-right",
          className
        )}
      >
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

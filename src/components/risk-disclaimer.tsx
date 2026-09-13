"use client";

import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const DISCLAIMER_COPY =
  "Bursa adalah platform edukasi, bukan broker atau aplikasi eksekusi trading. Materi membantu kamu memahami riset dan manajemen risiko. Keputusan investasi sepenuhnya ada pada kamu, dan trading tetap berisiko kehilangan modal.";

/**
 * Platform risk/compliance disclaimer (section layout). Footer compact copy removed;
 * see `/terms#risiko` and `termsOfService` §11 in `lib/legal/content.ts`.
 */
export function RiskDisclaimer({
  className,
}: {
  className?: string;
}) {
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

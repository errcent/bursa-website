import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LearningGuidanceEntry() {
  return (
    <section className="catalog-guidance" aria-label="Panduan belajar">
      <div className="catalog-guidance__panel">
        <div className="catalog-guidance__copy">
          <p className="eyebrow mb-1.5 text-[0.6875rem] tracking-[0.14em] text-muted-foreground/70">
            Panduan belajar
          </p>
          <h3 className="catalog-guidance__title">Temukan kelas & mentor yang cocok</h3>
          <p className="catalog-guidance__meta">Quiz singkat · ~2 menit · rekomendasi personal</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/panduan-belajar" />}
          className="catalog-guidance__action w-full sm:w-auto"
        >
          Mulai
          <ArrowRight className="size-3.5 opacity-50" strokeWidth={1.75} />
        </Button>
      </div>
    </section>
  );
}

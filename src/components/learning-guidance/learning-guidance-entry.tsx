import Link from "next/link";

import { Button } from "@/components/ui/button";

export function LearningGuidanceEntry() {
  return (
    <section className="catalog-guidance" aria-label="Rekomendasi kelas dan playlist">
      <div className="catalog-guidance__panel">
        <div className="catalog-guidance__body">
          <div className="catalog-guidance__copy">
            <h3 className="catalog-guidance__title">Temukan kelas & playlist yang cocok</h3>
            <p className="catalog-guidance__meta">Quiz singkat untuk rekomendasi personal</p>
          </div>
        </div>
        <Button
          size="sm"
          render={<Link href="/panduan-belajar" />}
          className="catalog-guidance__action btn-primary w-full sm:w-auto"
        >
          Mulai
        </Button>
      </div>
    </section>
  );
}

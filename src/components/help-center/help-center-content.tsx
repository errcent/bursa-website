"use client";

import { useMemo, useState } from "react";
import { Mail, Search, X } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  helpCategories as allHelpCategories,
  helpFaqs as allHelpFaqs,
  searchHelpFaqs,
  type HelpCategory,
} from "@/lib/help-center/content";
import { cn } from "@/lib/utils";

const helpCategories = allHelpCategories.filter((c) => c !== "Komunitas");
const helpFaqs = allHelpFaqs.filter((f) => f.category !== "Komunitas");

export function HelpCenterContent() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<HelpCategory | "Semua">("Semua");

  const filteredFaqs = useMemo(() => {
    let results = searchHelpFaqs(query);
    if (activeCategory !== "Semua") {
      results = results.filter((f) => f.category === activeCategory);
    }
    return results;
  }, [query, activeCategory]);

  const groupedFaqs = useMemo(() => {
    if (activeCategory !== "Semua" || query.trim()) {
      return [
        {
          category: activeCategory === "Semua" ? "Hasil pencarian" : activeCategory,
          faqs: filteredFaqs,
        },
      ];
    }
    return helpCategories.map((category) => ({
      category,
      faqs: filteredFaqs.filter((f) => f.category === category),
    }));
  }, [activeCategory, query, filteredFaqs]);

  return (
    <div className="flex flex-col gap-10">
      <Reveal>
        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari pertanyaan, topik, atau kata kunci…"
            className="lab-search"
            aria-label="Cari di pusat bantuan"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              aria-label="Hapus pencarian"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="flex flex-wrap gap-2">
          <FilterPill
            active={activeCategory === "Semua"}
            onClick={() => setActiveCategory("Semua")}
            label="Semua"
          />
          {helpCategories.map((category) => (
            <FilterPill
              key={category}
              active={activeCategory === category}
              onClick={() => setActiveCategory(category)}
              label={category}
            />
          ))}
        </div>
      </Reveal>

      {filteredFaqs.length === 0 ? (
        <div className="border-y border-border/60 py-12 text-center">
          <p className="font-heading text-base font-medium">Tidak ada hasil</p>
          <p className="section-copy mx-auto mt-2 max-w-sm">
            Coba kata kunci lain atau pilih kategori berbeda. Tim support siap membantu jika
            pertanyaanmu belum tercakup.
          </p>
        </div>
      ) : (
        groupedFaqs.map(({ category, faqs }) =>
          faqs.length > 0 ? (
            <section key={category}>
              <Reveal>
                <p className="eyebrow mb-2">{category === "Hasil pencarian" ? "Pencarian" : category}</p>
                <h2 className="section-title">
                  {category === "Hasil pencarian" ? category : `FAQ ${category}`}
                </h2>
              </Reveal>

              <Accordion className="mt-4">
                {faqs.map((faq, index) => (
                  <AccordionItem key={faq.id} value={`${category}-${faq.id}-${index}`}>
                    <AccordionTrigger className="faq-accordion-trigger text-left text-sm font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ) : null
        )
      )}

      <Reveal>
        <div className="flex flex-col gap-5 border-t border-border/60 pt-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="eyebrow">Dukungan</p>
            <h2 className="section-title">Hubungi tim support</h2>
            <p className="section-copy max-w-lg">
              Respons dalam 1–2 hari kerja. Sertakan email akun dan screenshot jika terkait
              pembayaran atau akses kelas.
            </p>
          </div>
          <Button className="btn-primary shrink-0" render={<a href="mailto:support@bursanalar.com" />}>
            <Mail className="size-4" />
            support@bursanalar.com
          </Button>
        </div>
      </Reveal>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("lab-pill", active ? "lab-pill--active" : "lab-pill--idle")}
    >
      {label}
    </button>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Mail, MessageCircle, Search } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  helpCategories as allHelpCategories,
  helpFaqs as allHelpFaqs,
  searchHelpFaqs,
  type HelpCategory,
} from "@/lib/help-center/content";
import { KOMUNITAS_ENABLED } from "@/lib/features/komunitas";
import { cn } from "@/lib/utils";

const helpCategories = KOMUNITAS_ENABLED
  ? allHelpCategories
  : allHelpCategories.filter((c) => c !== "Komunitas");

const helpFaqs = KOMUNITAS_ENABLED
  ? allHelpFaqs
  : allHelpFaqs.filter((f) => f.category !== "Komunitas");

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
      return [{ category: activeCategory === "Semua" ? "Hasil pencarian" : activeCategory, faqs: filteredFaqs }];
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
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari pertanyaan, topik, atau kata kunci..."
            className="h-12 w-full rounded-full border border-border bg-card/60 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
            aria-label="Cari di pusat bantuan"
          />
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("Semua")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              activeCategory === "Semua"
                ? "border-accent/40 bg-accent-soft text-accent"
                : "border-border bg-card/40 text-muted-foreground hover:border-accent/25 hover:text-foreground"
            )}
          >
            Semua
          </button>
          {helpCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                activeCategory === category
                  ? "border-accent/40 bg-accent-soft text-accent"
                  : "border-border bg-card/40 text-muted-foreground hover:border-accent/25 hover:text-foreground"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </Reveal>

      {filteredFaqs.length === 0 ? (
        <div className="surface-card flex flex-col items-center gap-3 border-dashed py-16 text-center">
          <p className="font-heading text-base font-medium">Tidak ada hasil</p>
          <p className="section-copy max-w-sm">
            Coba kata kunci lain atau pilih kategori berbeda. Tim support siap membantu jika
            pertanyaanmu belum tercakup.
          </p>
        </div>
      ) : (
        groupedFaqs.map(({ category, faqs }) =>
          faqs.length > 0 ? (
            <section key={category}>
              <Reveal>
                <div className="mb-4 flex items-center gap-2">
                  {category !== "Hasil pencarian" && (
                    <Badge variant="outline">{category}</Badge>
                  )}
                  <h2 className="section-title">{category === "Hasil pencarian" ? category : `FAQ ${category}`}</h2>
                </div>
              </Reveal>

              <Accordion className="mt-2">
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
        <div className="surface-card flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex flex-col gap-2">
            <p className="eyebrow">Butuh bantuan lebih lanjut?</p>
            <h2 className="section-title">Hubungi tim support</h2>
            <p className="section-copy max-w-lg">
              Respons dalam 1–2 hari kerja. Sertakan email akun dan screenshot jika terkait
              pembayaran atau akses kelas.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <Button className="btn-primary" render={<a href="mailto:support@bursa.id" />}>
              <Mail className="size-4" />
              support@bursa.id
            </Button>
            {KOMUNITAS_ENABLED && (
              <Button
                variant="outline"
                className="border-border/70"
                render={<a href="/komunitas" />}
              >
                <MessageCircle className="size-4" />
                Tanya di komunitas
              </Button>
            )}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

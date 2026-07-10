"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { homeFaqs } from "@/lib/home/faq-content";

export function HomeFaqSection() {
  return (
    <section
      id="faq"
      className="section-muted section-spacious scroll-mt-24 border-b border-border/60"
    >
      <div className="container-page">
        <Reveal className="max-w-2xl">
          <p className="eyebrow mb-3">FAQ</p>
          <h2 className="section-title sm:text-3xl">Pertanyaan yang sering diajukan</h2>
          <p className="section-copy mt-2">
            Jawaban singkat tentang cara belajar, mentor, dan model platform Bursa.
          </p>
        </Reveal>

        <Accordion className="mt-8 max-w-3xl">
          {homeFaqs.map((faq, index) => (
            <AccordionItem key={faq.id} value={`home-faq-${index}`}>
              <AccordionTrigger className="faq-accordion-trigger text-left text-sm font-medium sm:text-base">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground sm:pr-8">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Reveal delay={0.08} className="mt-8">
          <Link
            href="/bantuan"
            className="link-accent inline-flex min-h-14 items-center gap-1.5 text-sm font-medium"
          >
            Lihat semua pertanyaan di Pusat Bantuan
            <ArrowRight className="size-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

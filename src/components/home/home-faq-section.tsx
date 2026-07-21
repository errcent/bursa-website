"use client";

import Link from "next/link";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { HelpCircle, Plus, X } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { homeFaqs } from "@/lib/home/faq-content";
import { cn } from "@/lib/utils";

export function HomeFaqSection() {
  return (
    <section
      id="faq"
      className="section-muted section-spacious scroll-mt-24"
    >
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16 xl:gap-20">
          <Reveal className="lg:sticky lg:top-28">
            <p className="eyebrow mb-3 inline-flex items-center gap-2">
              <HelpCircle className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
              Pertanyaan Terjawab
            </p>
            <h2 className="font-heading text-2xl font-semibold tracking-[-0.02em] sm:text-3xl md:text-4xl">
              FAQ & Dukungan
            </h2>
            <p className="section-copy mt-3">Tidak menemukan jawaban yang kamu cari?</p>
            <Button
              size="lg"
              className="btn-primary mt-6 h-11 rounded-full px-7 text-sm"
              render={<Link href="/bantuan" />}
            >
              Hubungi Support
            </Button>
          </Reveal>

          <Reveal delay={0.06}>
            <AccordionPrimitive.Root className="flex w-full flex-col gap-1">
              {homeFaqs.map((faq, index) => (
                <AccordionPrimitive.Item
                  key={faq.id}
                  value={`home-faq-${index}`}
                  className="py-1"
                >
                  <AccordionPrimitive.Header className="flex">
                    <AccordionPrimitive.Trigger
                      className={cn(
                        "group/faq-trigger flex w-full min-h-14 items-center justify-between gap-4 py-4 text-left",
                        "text-sm font-medium sm:text-base",
                        "outline-none transition-colors hover:text-foreground/90",
                        "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      )}
                    >
                      <span className="min-w-0 flex-1 pr-2">{faq.question}</span>
                      <Plus
                        className="size-4 shrink-0 text-foreground group-aria-expanded/faq-trigger:hidden"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <X
                        className="hidden size-4 shrink-0 text-muted-foreground group-aria-expanded/faq-trigger:inline"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>
                  <AccordionPrimitive.Panel className="overflow-hidden text-sm data-open:animate-accordion-down data-closed:animate-accordion-up">
                    <div className="pb-5 pr-6 text-sm leading-relaxed text-muted-foreground sm:pr-10">
                      {faq.answer}
                    </div>
                  </AccordionPrimitive.Panel>
                </AccordionPrimitive.Item>
              ))}
            </AccordionPrimitive.Root>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

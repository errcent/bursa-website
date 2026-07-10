"use client";

import { Reveal } from "@/components/motion/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { mentorFaqs } from "@/lib/mentor-program/content";

export function MentorFaqSection() {
  return (
    <section>
      <Reveal>
        <p className="eyebrow mb-2">FAQ</p>
        <h2 className="section-title">Pertanyaan umum</h2>
      </Reveal>

      <Accordion className="mt-6">
        {mentorFaqs.map((faq, index) => (
          <AccordionItem key={faq.question} value={`faq-${index}`}>
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
  );
}

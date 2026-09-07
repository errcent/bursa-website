"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type TocHeading = { id: string; text: string; level: number };

export function PrivacySidebarToc({
  headings,
  locale = "id",
}: {
  headings: TocHeading[];
  locale?: "id" | "en";
}) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);
  const label = locale === "en" ? "On this page" : "Di halaman ini";

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav id="privacy-sidebar" className="privacy-sidebar-toc" aria-label={label}>
      <p className="eyebrow mb-3 text-xs">{label}</p>
      <ul className="flex flex-col gap-0.5">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "pl-3" : undefined}>
            <button
              type="button"
              aria-current={activeId === h.id ? "true" : undefined}
              className={cn(
                "w-full rounded-r-lg border-l-2 border-transparent px-3 py-2 text-left text-sm transition-colors",
                activeId === h.id
                  ? "border-primary bg-accent-soft/60 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
              onClick={() => {
                document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                setActiveId(h.id);
              }}
            >
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

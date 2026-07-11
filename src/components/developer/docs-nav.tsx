"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { DocNavSection } from "@/lib/developer-docs/sections";

function matchesQuery(section: DocNavSection, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = [section.label, section.number, ...(section.keywords ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

/** Highlights the doc section currently in view as the user scrolls. */
function useActiveSection(ids: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -65% 0px", threshold: [0, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

function DocsSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative shrink-0">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cari dokumentasi..."
        aria-label="Cari dokumentasi developer"
        className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-8 text-sm outline-none focus:border-primary/50"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Bersihkan pencarian"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function DocsNavList({
  sections,
  query,
  activeId,
  onNavigate,
}: {
  sections: DocNavSection[];
  query: string;
  activeId: string | null;
  onNavigate?: () => void;
}) {
  const filtered = useMemo(
    () => sections.filter((section) => matchesQuery(section, query)),
    [sections, query]
  );

  if (filtered.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-xs text-muted-foreground">
        Tidak ada bagian yang cocok dengan &ldquo;{query}&rdquo;.
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {filtered.map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            onClick={onNavigate}
            className={cn(
              "flex items-baseline gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
              activeId === section.id
                ? "bg-primary/15 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            {section.number && (
              <span className="w-4 shrink-0 font-mono text-[10px] text-muted-foreground/70">
                {section.number}
              </span>
            )}
            <span>{section.label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * Sidebar + mobile slide-out TOC for /developer/docs, with client-side search
 * over section headings/keywords and scroll-spy active-section highlighting.
 */
export function DeveloperDocsNav({ sections }: { sections: DocNavSection[] }) {
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const ids = useMemo(() => sections.map((section) => section.id), [sections]);
  const activeId = useActiveSection(ids);

  return (
    <>
      {/* Mobile: collapsible slide-out TOC */}
      <div className="mb-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={<Button variant="outline" size="sm" className="w-full justify-start gap-2" />}
          >
            <Menu className="size-4" />
            Daftar isi &amp; cari dokumentasi
          </SheetTrigger>
          <SheetContent side="left" className="flex w-[300px] flex-col p-0">
            <SheetHeader className="border-b border-border">
              <SheetTitle>Dokumentasi developer</SheetTitle>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
              <DocsSearchInput value={query} onChange={setQuery} />
              <nav aria-label="Navigasi dokumentasi (mobile)">
                <DocsNavList
                  sections={sections}
                  query={query}
                  activeId={activeId}
                  onNavigate={() => setMobileOpen(false)}
                />
              </nav>
            </div>
            <div className="border-t border-border p-4">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ← Kembali ke situs
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: sticky sidebar */}
      <aside className="hidden shrink-0 lg:sticky lg:top-24 lg:block lg:h-[calc(100vh-7rem)] lg:w-64">
        <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface/40 p-4">
          <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Daftar isi
          </p>
          <DocsSearchInput value={query} onChange={setQuery} />
          <nav className="min-h-0 flex-1 overflow-y-auto pr-1" aria-label="Navigasi dokumentasi">
            <DocsNavList sections={sections} query={query} activeId={activeId} />
          </nav>
          <div className="border-t border-border pt-3">
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
              ← Kembali ke situs
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

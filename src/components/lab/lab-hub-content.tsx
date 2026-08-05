"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search, X } from "lucide-react";

import { labScenarios } from "@/lib/lab/scenarios";
import {
  getAdvancedLabTools,
  getEssentialLabTools,
  getLabTool,
  labCategories,
  labTools,
  searchLabTools,
  type LabTool,
  type LabToolCategory,
} from "@/lib/lab/tools";
import { cn } from "@/lib/utils";

const difficultyLabel: Record<NonNullable<LabTool["difficulty"]>, string> = {
  pemula: "Pemula",
  menengah: "Menengah",
  lanjut: "Lanjut",
};

export function LabHubContent() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<LabToolCategory | "all">("all");

  const filteredTools = useMemo(() => {
    const searched = searchLabTools(query);
    if (activeCategory === "all") return searched;
    return searched.filter((tool) => tool.category === activeCategory);
  }, [query, activeCategory]);

  const isFiltered = Boolean(query) || activeCategory !== "all";
  const essentialTools = getEssentialLabTools();
  const advancedTools = getAdvancedLabTools();

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      <section aria-label="Pencarian dan filter" className="flex flex-col gap-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari kalkulator atau kata kunci…"
            className="lab-search"
            aria-label="Cari tool Lab"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              aria-label="Hapus pencarian"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <CategoryPill
            active={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
            label={`Semua (${labTools.length})`}
          />
          {labCategories.map((category) => (
            <CategoryPill
              key={category.id}
              active={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
              label={category.pillLabel}
            />
          ))}
        </div>
      </section>

      {isFiltered ? (
        <FilteredResults filteredTools={filteredTools} query={query} />
      ) : (
        <>
          <section aria-label="Tool esensial">
            <SectionHeader
              title="Esensial"
              description="Tool yang paling sering dipakai untuk risiko, biaya, dan probabilitas."
            />
            <ul className="mt-4 flex flex-col gap-2">
              {essentialTools.map((tool) => (
                <LabToolRow key={tool.id} tool={tool} />
              ))}
            </ul>
          </section>

          <section aria-label="Skenario terpandu">
            <SectionHeader
              title="Skenario"
              description="Rangkaian singkat antar tool esensial."
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {labScenarios.map((scenario) => (
                <div key={scenario.id} className="lab-workflow-card">
                  <div>
                    <h3 className="font-heading text-sm font-semibold tracking-tight">
                      {scenario.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {scenario.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {scenario.toolIds.map((toolId, stepIndex) => {
                      const tool = getLabTool(toolId);
                      if (!tool) return null;
                      return (
                        <Link key={toolId} href={tool.href} className="lab-workflow-step">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {stepIndex + 1}
                          </span>
                          {tool.shortTitle ?? tool.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <SectionHeader
                title="Lanjutan"
                description={`${advancedTools.length} tool — Kelly, biaya, teknikal.`}
              />
              <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
            </summary>
            <ul className="mt-4 flex flex-col gap-2">
              {advancedTools.map((tool) => (
                <LabToolRow key={tool.id} tool={tool} />
              ))}
            </ul>
          </details>
        </>
      )}
    </div>
  );
}

function FilteredResults({
  filteredTools,
  query,
}: {
  filteredTools: LabTool[];
  query: string;
}) {
  return (
    <section aria-label="Hasil pencarian">
      <SectionHeader
        title={
          filteredTools.length > 0
            ? `${filteredTools.length} tool ditemukan`
            : "Tidak ada tool yang cocok"
        }
        description={
          filteredTools.length > 0
            ? query
              ? `Hasil untuk “${query}”.`
              : "Pilih tool di bawah."
            : "Coba kata kunci lain — misalnya pip, monte carlo, atau breakeven."
        }
      />
      {filteredTools.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {filteredTools.map((tool) => (
            <LabToolRow key={tool.id} tool={tool} />
          ))}
        </ul>
      ) : (
        <div className="surface-card mt-4 px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Tidak ada hasil. Reset pencarian atau pilih kategori lain.
          </p>
        </div>
      )}
    </section>
  );
}

function LabToolRow({ tool }: { tool: LabTool }) {
  const Icon = tool.icon;
  return (
    <li>
      <Link href={tool.href} className="lab-tool-row group">
        <span className="lab-tool-card-icon">
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-medium text-foreground group-hover:text-accent">
              {tool.shortTitle ?? tool.title}
            </span>
            {tool.difficulty && (
              <span className="text-[11px] text-muted-foreground">
                · {difficultyLabel[tool.difficulty]}
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {tool.description}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground" />
      </Link>
    </li>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="font-heading text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function CategoryPill({
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

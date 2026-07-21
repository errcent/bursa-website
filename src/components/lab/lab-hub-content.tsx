"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { LabToolCard } from "@/components/lab/lab-tool-card";
import { Reveal } from "@/components/motion/reveal";
import {
  getFeaturedLabTools,
  getLabTool,
  getLabToolsByCategory,
  labCategories,
  searchLabTools,
  type LabToolCategory,
} from "@/lib/lab/tools";
import { labWorkflows } from "@/lib/lab/workflows";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export function LabHubContent() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<LabToolCategory | "all">("all");

  const filteredTools = useMemo(() => {
    const searched = searchLabTools(query);
    if (activeCategory === "all") return searched;
    return searched.filter((tool) => tool.category === activeCategory);
  }, [query, activeCategory]);

  const featuredTools = getFeaturedLabTools();
  const showFeatured = !query && activeCategory === "all";

  return (
    <div className="flex flex-col gap-14 sm:gap-16">
      <section aria-label="Pencarian dan filter" className="flex flex-col gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari kalkulator, simulasi, atau kata kunci…"
            className="w-full rounded-2xl border border-border/80 bg-surface/80 py-3.5 pl-11 pr-11 text-sm outline-none transition-[border-color,box-shadow] focus:border-accent/45 focus:shadow-[0_0_24px_var(--glow)]"
            aria-label="Cari tool Lab"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
            label="Semua"
          />
          {labCategories.map((category) => (
            <CategoryPill
              key={category.id}
              active={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
              label={category.title.split(" ")[0]}
            />
          ))}
        </div>
      </section>

      {!showFeatured && (
        <ToolResults
          activeCategory={activeCategory}
          query={query}
          filteredTools={filteredTools}
        />
      )}

      {showFeatured && (
        <section aria-label="Tool unggulan">
          <SectionHeader
            eyebrow="Unggulan"
            title="Mulai dari sini"
            description="Empat tool paling sering dipakai trader untuk risiko, expectancy, simulasi, dan backtest."
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredTools.map((tool) => (
              <LabToolCard key={tool.id} tool={tool} compact />
            ))}
          </div>
        </section>
      )}

      <section aria-label="Alur kerja terpandu">
        <SectionHeader
          eyebrow="Workflow"
          title="Rangkaian tool terpandu"
          description="Ikuti alur belajar praktis — dari persiapan entry hingga review performa."
        />
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {labWorkflows.map((workflow, index) => {
            const Icon = workflow.icon;
            return (
              <Reveal key={workflow.id} delay={index * 0.05}>
                <div className="surface-card group flex h-full flex-col gap-4 p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40",
                        workflow.accent
                      )}
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <div>
                      <h3 className="font-heading text-base font-semibold tracking-tight sm:text-lg">
                        {workflow.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {workflow.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {workflow.toolIds.map((toolId, stepIndex) => {
                      const tool = getLabTool(toolId);
                      if (!tool) return null;
                      return (
                        <Link
                          key={toolId}
                          href={tool.href}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground/90 transition-colors hover:border-accent/35 hover:bg-accent-soft/50 hover:text-accent"
                        >
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {stepIndex + 1}
                          </span>
                          {tool.shortTitle ?? tool.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {showFeatured && (
        <ToolResults
          activeCategory={activeCategory}
          query={query}
          filteredTools={filteredTools}
        />
      )}
    </div>
  );
}

function ToolResults({
  activeCategory,
  query,
  filteredTools,
}: {
  activeCategory: LabToolCategory | "all";
  query: string;
  filteredTools: ReturnType<typeof searchLabTools>;
}) {
  const isFiltered = activeCategory !== "all" || Boolean(query);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${activeCategory}-${query}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.28, ease }}
        className={cn("flex flex-col", isFiltered ? "gap-5" : "gap-12")}
      >
        {activeCategory === "all" && !query
          ? labCategories.map((category, categoryIndex) => {
              const tools = getLabToolsByCategory(category.id);
              if (tools.length === 0) return null;
              return (
                <section key={category.id} id={category.id} aria-label={category.title}>
                  <Reveal delay={categoryIndex * 0.03}>
                    <div
                      className={cn(
                        "mb-5 rounded-2xl border border-border/40 bg-gradient-to-r p-4 sm:p-5",
                        category.accent
                      )}
                    >
                      <h2 className="font-heading text-lg font-semibold tracking-tight sm:text-xl">
                        {category.title}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {tools.map((tool) => (
                        <LabToolCard key={tool.id} tool={tool} />
                      ))}
                    </div>
                  </Reveal>
                </section>
              );
            })
          : (
            <section aria-label="Hasil pencarian">
              <SectionHeader
                eyebrow="Hasil"
                title={
                  filteredTools.length > 0
                    ? `${filteredTools.length} tool ditemukan`
                    : "Tidak ada tool yang cocok"
                }
                description={
                  filteredTools.length > 0
                    ? "Pilih tool di bawah atau ubah filter pencarian."
                    : "Coba kata kunci lain — misalnya pip, monte carlo, atau breakeven."
                }
              />
              {filteredTools.length > 0 && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTools.map((tool) => (
                    <LabToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              )}
            </section>
          )}
      </motion.div>
    </AnimatePresence>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="eyebrow mb-1.5">{eyebrow}</p>
      <h2 className="section-title">{title}</h2>
      <p className="section-copy mt-1 max-w-2xl">{description}</p>
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
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 sm:text-sm",
        active
          ? "border-accent/40 bg-accent-soft text-accent shadow-[0_0_20px_var(--glow)]"
          : "border-border/70 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

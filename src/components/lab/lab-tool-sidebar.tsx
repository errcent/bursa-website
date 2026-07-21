"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { labCategories, labTools } from "@/lib/lab/tools";
import { cn } from "@/lib/utils";

export function LabToolSidebar({ currentToolId }: { currentToolId: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block">
      <nav
        aria-label="Navigasi tool Lab"
        className="surface-card sticky top-[calc(var(--site-header-offset)+1rem)] max-h-[calc(100dvh-var(--site-header-offset)-2rem)] overflow-y-auto p-3"
      >
        <Link
          href="/lab"
          className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          ← Semua tool
        </Link>

        <div className="flex flex-col gap-4">
          {labCategories.map((category) => {
            const tools = labTools.filter((tool) => tool.category === category.id);
            if (tools.length === 0) return null;

            return (
              <div key={category.id}>
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {category.title.split("&")[0].trim()}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {tools.map((tool) => {
                    const active = tool.id === currentToolId || pathname === tool.href;
                    return (
                      <li key={tool.id}>
                        <Link
                          href={tool.href}
                          className={cn(
                            "group flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                            active
                              ? "bg-accent-soft font-medium text-accent"
                              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                          )}
                          aria-current={active ? "page" : undefined}
                        >
                          <span className="line-clamp-1 flex-1">
                            {tool.shortTitle ?? tool.title}
                          </span>
                          {active && <ChevronRight className="size-3.5 shrink-0 opacity-70" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

export function LabToolMobileNav({ currentToolId }: { currentToolId: string }) {
  return (
    <div className="mb-5 lg:hidden">
      <label htmlFor="lab-tool-select" className="sr-only">
        Pilih tool lain
      </label>
      <select
        id="lab-tool-select"
        defaultValue={currentToolId}
        onChange={(e) => {
          window.location.href = `/lab/${e.target.value}`;
        }}
        className="w-full rounded-xl border border-border/80 bg-surface/80 px-3.5 py-2.5 text-sm outline-none focus:border-accent/45"
      >
        {labCategories.map((category) => (
          <optgroup key={category.id} label={category.title}>
            {labTools
              .filter((tool) => tool.category === category.id)
              .map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {tool.shortTitle ?? tool.title}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

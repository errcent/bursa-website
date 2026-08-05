"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";

import { getLabTool, getLabToolsByCategory, type LabToolCategory } from "@/lib/lab/tools";
import { cn } from "@/lib/utils";

export function LabToolSidebar({
  currentToolId,
  category,
}: {
  currentToolId: string;
  category: LabToolCategory;
}) {
  const pathname = usePathname();
  const categoryMeta = getLabTool(currentToolId);
  const tools = getLabToolsByCategory(category);

  return (
    <aside className="hidden lg:block">
      <nav aria-label="Navigasi tool Lab" className="lab-sidebar-nav">
        <Link
          href="/lab"
          className="lab-sidebar-link lab-sidebar-link--idle mb-2 px-3 py-2 text-sm font-medium"
        >
          ← Semua tool
        </Link>

        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
          {categoryMeta?.category === category
            ? getCategoryLabel(category)
            : getCategoryLabel(category)}
        </p>
        <ul className="flex flex-col gap-0.5 px-1">
          {tools.map((tool) => {
            const active = tool.id === currentToolId || pathname === tool.href;
            return (
              <li key={tool.id}>
                <Link
                  href={tool.href}
                  className={cn(
                    "lab-sidebar-link",
                    active ? "lab-sidebar-link--active" : "lab-sidebar-link--idle"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="line-clamp-2 flex-1">{tool.shortTitle ?? tool.title}</span>
                  {active && <ChevronRight className="size-3.5 shrink-0 opacity-60" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export function LabToolMobileNav({
  currentToolId,
  category,
}: {
  currentToolId: string;
  category?: LabToolCategory;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const currentTool = getLabTool(currentToolId);
  const tools = category ? getLabToolsByCategory(category) : [];

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onPointerDown);
      return () => document.removeEventListener("mousedown", onPointerDown);
    }
  }, [open]);

  return (
    <div ref={rootRef} className="relative mb-6 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="lab-mobile-nav-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="min-w-0 truncate">
          {currentTool?.shortTitle ?? currentTool?.title ?? "Pilih tool"}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className="absolute inset-x-0 top-[calc(100%+0.375rem)] z-30 max-h-[min(20rem,50dvh)] overflow-y-auto overscroll-contain rounded-xl border border-border/60 bg-popover p-2 shadow-lg"
          role="listbox"
        >
          <Link
            href="/lab"
            onClick={() => setOpen(false)}
            className="mb-1 block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted/40"
          >
            ← Semua tool
          </Link>
          {category && (
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {getCategoryLabel(category)}
            </p>
          )}
          <ul>
            {tools.map((tool) => {
              const active = tool.id === currentToolId;
              return (
                <li key={tool.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setOpen(false);
                      router.push(tool.href);
                    }}
                    className={cn(
                      "w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      active
                        ? "bg-accent-soft font-medium text-accent"
                        : "text-foreground/85 hover:bg-muted/40"
                    )}
                  >
                    {tool.shortTitle ?? tool.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function getCategoryLabel(category: LabToolCategory): string {
  const labels: Record<LabToolCategory, string> = {
    "risk-money": "Risiko & Modal",
    performance: "Probabilitas",
    "trading-mechanics": "Mekanika",
    technical: "Teknikal",
  };
  return labels[category];
}

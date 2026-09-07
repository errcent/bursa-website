"use client";

import Link from "next/link";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { BookOpen, Clock, Search, UserRound } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { SearchHighlight } from "@/components/search/search-highlight";
import type { SearchResult, SearchSuggestion } from "@/lib/search/engine";
import { cn } from "@/lib/utils";

const easeOut = [0.22, 1, 0.36, 1] as const;

const PANEL_SURFACE =
  "bg-popover text-popover-foreground dark:!bg-[#0d0d0f] dark:!text-[#e5e5e5]";

const SCROLL_HIDE =
  "overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

function ResultIcon({ type }: { type: SearchResult["type"] }) {
  if (type === "course") return <BookOpen className="size-3.5 shrink-0 text-muted-foreground" />;
  if (type === "mentor") return <UserRound className="size-3.5 shrink-0 text-muted-foreground" />;
  return <Search className="size-3.5 shrink-0 text-muted-foreground" />;
}

function SearchResultRow({
  result,
  query,
  active,
  onSelect,
  onHover,
}: {
  result: SearchResult;
  query: string;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  return (
    <Link
      href={result.href}
      onClick={onSelect}
      onMouseEnter={onHover}
      role="option"
      aria-selected={active}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors",
        active ? "bg-accent/10" : "hover:bg-muted/80"
      )}
    >
      <ResultIcon type={result.type} />
      <span className="min-w-0 flex-1 truncate text-sm">
        <SearchHighlight text={result.title} query={query} />
      </span>
    </Link>
  );
}

interface SearchDropdownProps {
  open: boolean;
  query: string;
  results: SearchResult[];
  trending: SearchSuggestion[];
  recentSearches: string[];
  activeIndex: number;
  onSelect: (href: string, query?: string) => void;
  onTrendingClick: (query: string) => void;
  onActiveIndexChange: (index: number) => void;
  anchorRef: RefObject<HTMLElement | null>;
  className?: string;
}

type PanelCoords = { top: number; left: number; width: number };

export function SearchDropdown({
  open,
  query,
  results,
  trending,
  recentSearches,
  activeIndex,
  onSelect,
  onTrendingClick,
  onActiveIndexChange,
  anchorRef,
  className,
}: SearchDropdownProps) {
  const hasQuery = query.trim().length > 0;
  const [coords, setCoords] = useState<PanelCoords | null>(null);
  const [mounted, setMounted] = useState(false);
  const panelMinWidthRef = useRef(0);

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.max(rect.width, panelMinWidthRef.current, 280);
    setCoords({
      top: rect.bottom + 8,
      left: rect.left,
      width,
    });
  }, [anchorRef]);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();

    const el = anchorRef.current;
    const ro = el ? new ResizeObserver(() => updatePosition()) : null;
    if (el && ro) ro.observe(el);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition, anchorRef, query, results.length, recentSearches.length]);

  useLayoutEffect(() => {
    if (open) {
      panelMinWidthRef.current = anchorRef.current?.getBoundingClientRect().width ?? 0;
    }
  }, [open, anchorRef]);

  let flatItems: { type: "result" | "recent" | "catalog"; data: SearchResult | string; href: string }[] =
    [];

  if (hasQuery) {
    flatItems = results.map((r) => ({ type: "result", data: r, href: r.href }));
    if (results.length === 0) {
      flatItems = [
        {
          type: "catalog",
          data: query,
          href: `/katalog?q=${encodeURIComponent(query)}`,
        },
      ];
    } else if (results.length >= 4) {
      flatItems.push({
        type: "catalog",
        data: query,
        href: `/katalog?q=${encodeURIComponent(query)}`,
      });
    }
  } else {
    flatItems = [
      ...recentSearches.slice(0, 4).map((q) => ({
        type: "recent" as const,
        data: q,
        href: `/katalog?q=${encodeURIComponent(q)}`,
      })),
    ];
  }

  const panel = (
    <AnimatePresence>
      {open && coords && (
        <>
          <motion.div
            key="search-dropdown-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: easeOut }}
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[190] bg-black/40"
          />
          <motion.div
            key="search-dropdown-panel"
            initial={{ y: -4, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -4, opacity: 0 }}
            transition={{ duration: 0.18, ease: easeOut }}
            data-search-dropdown=""
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
              backgroundColor: "var(--popover)",
            }}
            className={cn(
              "fixed z-[200] isolate overflow-hidden rounded-xl border border-border/80 shadow-[0_20px_48px_-16px_rgba(0,0,0,0.55)]",
              PANEL_SURFACE,
              className
            )}
            role="listbox"
            aria-label={hasQuery ? `Hasil untuk ${query}` : "Saran pencarian"}
          >
            <div className={cn("max-h-[min(60vh,360px)] px-1 py-1.5", SCROLL_HIDE, PANEL_SURFACE)}>
              {hasQuery ? (
                results.length > 0 ? (
                  <>
                    {results.map((result, idx) => (
                      <SearchResultRow
                        key={result.id}
                        result={result}
                        query={query}
                        active={activeIndex === idx}
                        onSelect={() => onSelect(result.href, query)}
                        onHover={() => onActiveIndexChange(idx)}
                      />
                    ))}
                    {results.length >= 4 ? (
                      <button
                        type="button"
                        role="option"
                        aria-selected={activeIndex === results.length}
                        onMouseEnter={() => onActiveIndexChange(results.length)}
                        onClick={() => onSelect(`/katalog?q=${encodeURIComponent(query)}`, query)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors",
                          activeIndex === results.length ? "bg-accent/10" : "hover:bg-muted/80"
                        )}
                      >
                        <Search className="size-3.5 shrink-0" />
                        <span className="truncate">Lihat semua di katalog</span>
                      </button>
                    ) : null}
                  </>
                ) : (
                  <div className="px-3 py-6 text-center">
                    <p className="text-sm text-muted-foreground">Tidak ada hasil</p>
                    <button
                      type="button"
                      onClick={() => onSelect(`/katalog?q=${encodeURIComponent(query)}`, query)}
                      className="link-accent mt-3 text-sm font-medium"
                    >
                      Cari di katalog
                    </button>
                  </div>
                )
              ) : (
                <>
                  {recentSearches.length > 0 ? (
                    <div className="mb-1">
                      {recentSearches.slice(0, 4).map((q, i) => (
                        <button
                          key={q}
                          type="button"
                          role="option"
                          aria-selected={activeIndex === i}
                          onMouseEnter={() => onActiveIndexChange(i)}
                          onClick={() => onTrendingClick(q)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                            activeIndex === i ? "bg-accent/10" : "hover:bg-muted/80"
                          )}
                        >
                          <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{q}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {trending.length > 0 ? (
                    <div
                      className={cn(
                        "flex flex-wrap gap-1.5 px-2 pb-1",
                        recentSearches.length > 0 && "border-t border-border/60 pt-2"
                      )}
                    >
                      {trending.slice(0, 6).map((s) => (
                        <button
                          key={s.query}
                          type="button"
                          onClick={() => onTrendingClick(s.query)}
                          className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-accent/30 hover:text-foreground"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return mounted ? createPortal(panel, document.body) : null;
}

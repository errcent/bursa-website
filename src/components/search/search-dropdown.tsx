"use client";

import Link from "next/link";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  BookOpen,
  Clock,
  GraduationCap,
  Search,
  Sparkles,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { SearchHighlight } from "@/components/search/search-highlight";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SearchResult, SearchSuggestion } from "@/lib/search/engine";
import { cn } from "@/lib/utils";

const easeOut = [0.22, 1, 0.36, 1] as const;

/** Solid popover fill — never glass / never token alpha. */
const PANEL_SURFACE =
  "bg-popover text-popover-foreground dark:!bg-[#0d0d0f] dark:!text-[#e5e5e5]";

function ResultIcon({ type }: { type: SearchResult["type"] }) {
  if (type === "course") return <BookOpen className="size-4 shrink-0 text-accent" />;
  if (type === "mentor") return <UserRound className="size-4 shrink-0 text-emerald" />;
  return <Sparkles className="size-4 shrink-0 text-amber-400" />;
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
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
        active ? "bg-accent/12" : "hover:bg-muted"
      )}
    >
      {result.type === "mentor" ? (
        <Avatar className="size-9 shrink-0 border border-border">
          {result.imageUrl ? (
            <AvatarImage src={result.imageUrl} alt="" />
          ) : null}
          <AvatarFallback className="text-xs">{result.initials}</AvatarFallback>
        </Avatar>
      ) : (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
          <ResultIcon type={result.type} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-snug">
          <SearchHighlight text={result.title} query={query} />
        </p>
        <p className="truncate text-xs text-muted-foreground">{result.subtitle}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {result.badge && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {result.badge}
          </span>
        )}
        {result.meta && (
          <span className="text-[10px] text-muted-foreground">{result.meta}</span>
        )}
      </div>

      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 pb-1.5 pt-2">
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </span>
    </div>
  );
}

interface SearchDropdownProps {
  open: boolean;
  query: string;
  results: SearchResult[];
  trending: SearchSuggestion[];
  popularCourses: SearchResult[];
  popularMentors: SearchResult[];
  recentSearches: string[];
  activeIndex: number;
  onSelect: (href: string, query?: string) => void;
  onTrendingClick: (query: string) => void;
  onActiveIndexChange: (index: number) => void;
  onRemoveRecent?: (query: string) => void;
  onClearRecent?: () => void;
  /** When true, panel only renders query results — no empty-state suggestions. */
  queryOnly?: boolean;
  /** Hide the "view all results" footer action (e.g. on catalog page). */
  hideViewAll?: boolean;
  className?: string;
}

type PanelCoords = { top: number; left: number; width: number };

export function SearchDropdown({
  open,
  query,
  results,
  trending,
  popularCourses,
  popularMentors,
  recentSearches,
  activeIndex,
  onSelect,
  onTrendingClick,
  onActiveIndexChange,
  onRemoveRecent,
  onClearRecent,
  queryOnly = false,
  hideViewAll = false,
  className,
}: SearchDropdownProps) {
  const hasQuery = query.trim().length > 0;
  const courseResults = results.filter((r) => r.type === "course");
  const mentorResults = results.filter((r) => r.type === "mentor");
  const topicResults = results.filter((r) => r.type === "topic");

  const anchorRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<PanelCoords | null>(null);
  const [mounted, setMounted] = useState(false);

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    // Capture scroll from any scrollable ancestor
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition, query, results.length]);

  let flatItems: { type: "result" | "trending" | "recent"; data: SearchResult | string; href?: string }[] = [];

  if (hasQuery) {
    flatItems = results.map((r) => ({ type: "result" as const, data: r, href: r.href }));
    if (results.length === 0) {
      flatItems = [{ type: "trending" as const, data: query, href: `/katalog?q=${encodeURIComponent(query)}` }];
    }
  } else {
    flatItems = [
      ...recentSearches.map((q) => ({ type: "recent" as const, data: q, href: `/katalog?q=${encodeURIComponent(q)}` })),
      ...popularCourses.map((r) => ({ type: "result" as const, data: r, href: r.href })),
      ...popularMentors.map((r) => ({ type: "result" as const, data: r, href: r.href })),
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
            transition={{ duration: 0.12, ease: easeOut }}
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[190] bg-black/60"
          />
          <motion.div
            key="search-dropdown-panel"
            initial={{ y: -6, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -6, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.16, ease: easeOut }}
            data-search-dropdown=""
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
              backgroundColor: "var(--popover)",
            }}
            className={cn(
              // Portaled + solid popover — escapes surface-card backdrop-blur stacking
              "fixed z-[200] isolate overflow-hidden rounded-2xl border-2 border-border shadow-[0_28px_64px_-12px_rgba(0,0,0,0.7),0_12px_28px_-8px_rgba(0,0,0,0.5)] dark:border-white/10",
              PANEL_SURFACE,
              className
            )}
            role="listbox"
            aria-label={hasQuery ? `Hasil pencarian untuk ${query}` : "Rekomendasi pencarian"}
          >
            <div
              aria-hidden
              className={cn("pointer-events-none absolute inset-0 -z-10", PANEL_SURFACE)}
              style={{ backgroundColor: "var(--popover)" }}
            />
            <div
              className={cn(
                "relative max-h-[min(70vh,420px)] overflow-y-auto overscroll-contain py-2",
                PANEL_SURFACE
              )}
              style={{ backgroundColor: "var(--popover)" }}
            >
              {hasQuery ? (
                results.length > 0 ? (
                  <>
                    {courseResults.length > 0 && (
                      <div>
                        <SectionLabel icon={GraduationCap}>
                          Kelas ({courseResults.length})
                        </SectionLabel>
                        {courseResults.map((result) => {
                          const idx = flatItems.findIndex(
                            (f) => f.type === "result" && (f.data as SearchResult).id === result.id
                          );
                          return (
                            <SearchResultRow
                              key={result.id}
                              result={result}
                              query={query}
                              active={activeIndex === idx}
                              onSelect={() => onSelect(result.href, query)}
                              onHover={() => onActiveIndexChange(idx)}
                            />
                          );
                        })}
                      </div>
                    )}

                    {mentorResults.length > 0 && (
                      <div className={courseResults.length > 0 ? "mt-1 border-t border-border pt-1" : ""}>
                        <SectionLabel icon={UserRound}>
                          Mentor ({mentorResults.length})
                        </SectionLabel>
                        {mentorResults.map((result) => {
                          const idx = flatItems.findIndex(
                            (f) => f.type === "result" && (f.data as SearchResult).id === result.id
                          );
                          return (
                            <SearchResultRow
                              key={result.id}
                              result={result}
                              query={query}
                              active={activeIndex === idx}
                              onSelect={() => onSelect(result.href, query)}
                              onHover={() => onActiveIndexChange(idx)}
                            />
                          );
                        })}
                      </div>
                    )}

                    {topicResults.length > 0 && (
                      <div className="mt-1 border-t border-border pt-1">
                        <SectionLabel icon={Sparkles}>Topik terkait</SectionLabel>
                        {topicResults.map((result) => {
                          const idx = flatItems.findIndex(
                            (f) => f.type === "result" && (f.data as SearchResult).id === result.id
                          );
                          return (
                            <SearchResultRow
                              key={result.id}
                              result={result}
                              query={query}
                              active={activeIndex === idx}
                              onSelect={() => onSelect(result.href, query)}
                              onHover={() => onActiveIndexChange(idx)}
                            />
                          );
                        })}
                      </div>
                    )}

                    {!hideViewAll ? (
                      <div className="mt-1 border-t border-border px-3 py-2">
                        <button
                          type="button"
                          onClick={() =>
                            onSelect(`/katalog?q=${encodeURIComponent(query)}`, query)
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <Search className="size-3.5" />
                          Lihat semua hasil untuk &ldquo;{query}&rdquo;
                        </button>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm font-medium">Tidak ada hasil untuk &ldquo;{query}&rdquo;</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Coba kata kunci lain atau jelajahi rekomendasi di bawah
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {trending.slice(0, 4).map((s) => (
                        <button
                          key={s.query}
                          type="button"
                          onClick={() => onTrendingClick(s.query)}
                          className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-accent/30 hover:bg-muted hover:text-foreground"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ) : queryOnly ? null : (
                <>
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between gap-2 pr-2">
                        <SectionLabel icon={Clock}>Pencarian terakhir</SectionLabel>
                        {onClearRecent ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onClearRecent();
                            }}
                            className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            Hapus semua
                          </button>
                        ) : null}
                      </div>
                      {recentSearches.map((q, i) => (
                        <div
                          key={q}
                          role="option"
                          aria-selected={activeIndex === i}
                          onMouseEnter={() => onActiveIndexChange(i)}
                          className={cn(
                            "group flex w-full items-center gap-1 rounded-xl px-1.5 py-0.5 transition-colors",
                            activeIndex === i ? "bg-accent/12" : "hover:bg-muted"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => onTrendingClick(q)}
                            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1.5 py-1.5 text-left text-sm"
                          >
                            <Clock className="size-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{q}</span>
                          </button>
                          {onRemoveRecent ? (
                            <button
                              type="button"
                              aria-label={`Hapus pencarian ${q}`}
                              title="Hapus"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onRemoveRecent(q);
                              }}
                              className="mr-1 flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-70 transition-colors hover:bg-background hover:text-foreground group-hover:opacity-100"
                            >
                              <X className="size-3.5" />
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={recentSearches.length > 0 ? "mt-1 border-t border-border pt-1" : ""}>
                    <SectionLabel icon={TrendingUp}>Populer dicari</SectionLabel>
                    <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                      {trending.map((s) => (
                        <button
                          key={s.query}
                          type="button"
                          onClick={() => onTrendingClick(s.query)}
                          className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-accent/25 hover:bg-accent/12 hover:text-foreground"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {popularCourses.length > 0 && (
                    <div className="mt-1 border-t border-border pt-1">
                      <SectionLabel icon={GraduationCap}>Kelas populer</SectionLabel>
                      {popularCourses.map((result, i) => {
                        const idx = recentSearches.length + i;
                        return (
                          <SearchResultRow
                            key={result.id}
                            result={result}
                            query=""
                            active={activeIndex === idx}
                            onSelect={() => onSelect(result.href)}
                            onHover={() => onActiveIndexChange(idx)}
                          />
                        );
                      })}
                    </div>
                  )}

                  {popularMentors.length > 0 && (
                    <div className="mt-1 border-t border-border pt-1">
                      <SectionLabel icon={UserRound}>Mentor unggulan</SectionLabel>
                      {popularMentors.map((result, i) => {
                        const idx = recentSearches.length + popularCourses.length + i;
                        return (
                          <SearchResultRow
                            key={result.id}
                            result={result}
                            query=""
                            active={activeIndex === idx}
                            onSelect={() => onSelect(result.href)}
                            onHover={() => onActiveIndexChange(idx)}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            <div
              className="relative flex items-center justify-between border-t border-border bg-muted px-4 py-2"
              style={{ backgroundColor: "var(--muted)" }}
            >
              <span className="text-[10px] text-muted-foreground">
                <kbd className="rounded border border-border bg-popover px-1 py-0.5 font-mono">↑↓</kbd> navigasi
                {" · "}
                <kbd className="rounded border border-border bg-popover px-1 py-0.5 font-mono">↵</kbd> pilih
                {" · "}
                <kbd className="rounded border border-border bg-popover px-1 py-0.5 font-mono">esc</kbd> tutup
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Anchor sits under the search field; panel is portaled to body so glass parents can't trap it */}
      <div ref={anchorRef} className="pointer-events-none absolute inset-x-0 top-full h-0" aria-hidden />
      {mounted ? createPortal(panel, document.body) : null}
    </>
  );
}

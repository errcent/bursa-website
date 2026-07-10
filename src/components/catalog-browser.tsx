"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CourseCard } from "@/components/course-card";
import { MentorCard } from "@/components/mentor-card";
import { Reveal } from "@/components/motion/reveal";
import {
  mentorGetScrollPerView,
  SCROLL_CAROUSEL_GAP,
  ScrollCarousel,
} from "@/components/scroll-carousel";
import { SnapCollapse, SnapPresence } from "@/components/motion/snap";
import { SearchDropdown } from "@/components/search/search-dropdown";
import { SearchPlaceholderMarquee } from "@/components/search/search-placeholder-marquee";
import { useMyLearning } from "@/hooks/use-my-learning";
import { useMobileLayout } from "@/hooks/use-mobile-layout";
import {
  clearRecentSearches,
  detectSearchIntent,
  getPopularCourses,
  getPopularMentors,
  getRecentSearches,
  getTrendingSuggestions,
  removeRecentSearch,
  saveRecentSearch,
  searchAll,
} from "@/lib/search/engine";
import { cn } from "@/lib/utils";
import type { Course, Instrument, Level, Mentor } from "@/lib/types";
import type { LearningCourseProgress } from "@/hooks/use-my-learning";

const instrumentOptions: (Instrument | "Semua")[] = ["Semua", "Saham", "Crypto", "Forex"];
const levelOptions: (Level | "Semua")[] = ["Semua", "Pemula", "Menengah", "Mahir"];
const validInstruments: Instrument[] = ["Saham", "Crypto", "Forex"];

type ViewMode = "kelas" | "instruktur";
type SortMode = "populer" | "rating" | "harga-rendah" | "harga-tinggi";

interface CatalogBrowserProps {
  courses: Course[];
  mentors: Mentor[];
  initialInstrument?: Instrument | "Semua";
  initialQuery?: string;
  initialView?: ViewMode;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

function parseInstrumentParam(value: string | null): Instrument | "Semua" {
  return validInstruments.includes(value as Instrument)
    ? (value as Instrument)
    : "Semua";
}

function parseViewParam(value: string | null): ViewMode {
  return value === "instruktur" ? "instruktur" : "kelas";
}

function buildCatalogQueryString(
  query: string,
  instrument: Instrument | "Semua",
  view: ViewMode
): string {
  const params = new URLSearchParams();
  const trimmedQuery = query.trim();
  if (trimmedQuery) params.set("q", trimmedQuery);
  if (instrument !== "Semua") params.set("instrumen", instrument);
  if (view !== "kelas") params.set("view", view);
  return params.toString();
}

const sortOptions: { key: SortMode; label: string }[] = [
  { key: "populer", label: "Paling populer" },
  { key: "rating", label: "Rating tertinggi" },
  { key: "harga-rendah", label: "Harga terendah" },
  { key: "harga-tinggi", label: "Harga tertinggi" },
];

function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ease-out",
        active
          ? "border-primary/30 bg-primary text-primary-foreground shadow-[0_0_18px_var(--glow)]"
          : "border-border bg-transparent text-muted-foreground hover:border-accent/30 hover:text-foreground",
        className
      )}
    >
      {children}
    </motion.button>
  );
}

function countActiveFilters(
  instrument: Instrument | "Semua",
  level: Level | "Semua",
  sort: SortMode,
  view: ViewMode
): number {
  let count = 0;
  if (instrument !== "Semua") count++;
  if (view === "kelas") {
    if (level !== "Semua") count++;
    if (sort !== "populer") count++;
  }
  return count;
}

function CatalogFilterPanels({
  view,
  instrument,
  level,
  sort,
  onInstrumentChange,
  onLevelChange,
  onSortChange,
  showLabels,
  touchFriendly,
}: {
  view: ViewMode;
  instrument: Instrument | "Semua";
  level: Level | "Semua";
  sort: SortMode;
  onInstrumentChange: (value: Instrument | "Semua") => void;
  onLevelChange: (value: Level | "Semua") => void;
  onSortChange: (value: SortMode) => void;
  showLabels: boolean;
  touchFriendly?: boolean;
}) {
  const chipClass = touchFriendly ? "min-h-11 px-4" : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-1 flex flex-wrap items-center gap-2 px-1 sm:flex-nowrap sm:overflow-x-auto">
        {showLabels && (
          <span className="flex w-full shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground sm:w-auto sm:pr-1">
            <SlidersHorizontal className="size-3.5" />
            Instrumen
          </span>
        )}
        {instrumentOptions.map((opt) => (
          <Chip
            key={opt}
            active={instrument === opt}
            onClick={() => onInstrumentChange(opt)}
            className={chipClass}
          >
            {opt}
          </Chip>
        ))}
      </div>

      {view === "kelas" && (
        <>
          <div className="-mx-1 flex flex-wrap items-center gap-2 px-1 sm:flex-nowrap sm:overflow-x-auto">
            {showLabels && (
              <span className="w-full shrink-0 text-xs font-medium text-muted-foreground sm:w-auto sm:pr-1">
                Level
              </span>
            )}
            {levelOptions.map((opt) => (
              <Chip
                key={opt}
                active={level === opt}
                onClick={() => onLevelChange(opt)}
                className={chipClass}
              >
                {opt}
              </Chip>
            ))}
          </div>

          <div className="-mx-1 flex flex-wrap items-center gap-2 px-1 sm:flex-nowrap sm:overflow-x-auto">
            {showLabels && (
              <span className="w-full shrink-0 text-xs font-medium text-muted-foreground sm:w-auto sm:pr-1">
                Urutkan
              </span>
            )}
            {sortOptions.map((opt) => (
              <Chip
                key={opt.key}
                active={sort === opt.key}
                onClick={() => onSortChange(opt.key)}
                className={chipClass}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function matchesQuery(
  course: Course,
  mentor: Mentor | undefined,
  tokens: string[]
): boolean {
  if (tokens.length === 0) return true;
  const haystack = [
    course.title,
    course.shortDescription,
    course.instrument,
    course.level,
    mentor?.name ?? "",
    mentor?.title ?? "",
    ...course.outcomes,
  ]
    .join(" ")
    .toLowerCase();

  return tokens.every((t) => haystack.includes(t));
}

function matchesMentorQuery(mentor: Mentor, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const haystack = [mentor.name, mentor.title, mentor.bio, ...mentor.instruments]
    .join(" ")
    .toLowerCase();
  return tokens.every((t) => haystack.includes(t));
}

type CatalogCourseRowProps = {
  title: string;
  courses: Course[];
  count?: number;
  enrollmentBySlug: Map<string, LearningCourseProgress>;
};

function CatalogCourseRow({ title, courses, count, enrollmentBySlug }: CatalogCourseRowProps) {
  const isMobile = useMobileLayout();

  if (courses.length === 0) return null;

  return (
    <section className="catalog-row" aria-label={title}>
      <h3 className="catalog-row-title">
        {title}
        {count !== undefined && (
          <span className="catalog-row-count">{count}</span>
        )}
      </h3>
      <div className="catalog-row-bleed">
        <ScrollCarousel
          ariaLabel={title}
          fixedItemWidth={isMobile ? "var(--catalog-card-width)" : undefined}
          gap={isMobile ? 8 : SCROLL_CAROUSEL_GAP}
        >
          {courses.map((course) => {
            const learning = enrollmentBySlug.get(course.slug);
            return (
              <CourseCard
                key={course.slug}
                course={course}
                variant={isMobile ? "poster" : "default"}
                className="w-full"
                enrollment={
                  learning
                    ? {
                        progressPercent: learning.progressPercent,
                        completedLessons: learning.completedLessons,
                        totalLessons: learning.totalLessons,
                        lastLessonId: learning.lastLessonId,
                      }
                    : null
                }
              />
            );
          })}
        </ScrollCarousel>
      </div>
    </section>
  );
}

function CatalogMentorRow({ title, mentors, count }: { title: string; mentors: Mentor[]; count?: number }) {
  const isMobile = useMobileLayout();

  if (mentors.length === 0) return null;

  return (
    <section className="catalog-row" aria-label={title}>
      <h3 className="catalog-row-title">
        {title}
        {count !== undefined && (
          <span className="catalog-row-count">{count}</span>
        )}
      </h3>
      <div className="catalog-row-bleed">
        <ScrollCarousel
          ariaLabel={title}
          getPerView={mentorGetScrollPerView}
          fixedItemWidth={isMobile ? "var(--catalog-mentor-card-width)" : undefined}
          mobilePeekRatio={0.72}
          gap={isMobile ? 8 : SCROLL_CAROUSEL_GAP}
        >
          {mentors.map((mentor) => (
            <MentorCard
              key={mentor.slug}
              mentor={mentor}
              variant={isMobile ? "compact" : "default"}
              className="w-full"
            />
          ))}
        </ScrollCarousel>
      </div>
    </section>
  );
}

export function CatalogBrowser({
  courses,
  mentors,
  initialInstrument = "Semua",
  initialQuery = "",
  initialView = "kelas",
}: CatalogBrowserProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [view, setView] = useState<ViewMode>(initialView);
  const [instrument, setInstrument] = useState<Instrument | "Semua">(initialInstrument);
  const [level, setLevel] = useState<Level | "Semua">("Semua");
  const [sort, setSort] = useState<SortMode>("populer");
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  /** Skip the first URL write so SSR/hydration props win over a stale client replace. */
  const skipUrlWriteRef = useRef(true);
  /** Tracks the last query string we applied from the URL (inbound) or wrote (outbound). */
  const lastSyncedQsRef = useRef(
    buildCatalogQueryString(initialQuery, initialInstrument, initialView)
  );

  const { bySlug: enrollmentBySlug } = useMyLearning();

  const trending = useMemo(() => getTrendingSuggestions(), []);
  const popularCourses = useMemo(() => getPopularCourses(3), []);
  const popularMentors = useMemo(() => getPopularMentors(2), []);
  const searchResults = useMemo(
    () => (debouncedQuery.trim() ? searchAll(debouncedQuery, 8) : []),
    [debouncedQuery]
  );

  const queryTokens = useMemo(
    () =>
      debouncedQuery
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter((t) => t.length > 1),
    [debouncedQuery]
  );

  const urlQs = searchParams.toString();

  // Inbound: footer/nav Link updates searchParams — adopt them into local state.
  // Must run before the outbound writer so we never replace a fresh URL with stale filters.
  useEffect(() => {
    if (urlQs === lastSyncedQsRef.current) return;

    const nextInstrument = parseInstrumentParam(searchParams.get("instrumen"));
    const nextQuery = searchParams.get("q")?.trim() ?? "";
    const nextView = parseViewParam(searchParams.get("view"));

    lastSyncedQsRef.current = urlQs;
    skipUrlWriteRef.current = true;

    setInstrument(nextInstrument);
    setQuery(nextQuery);
    setDebouncedQuery(nextQuery);
    setView(nextView);
  }, [urlQs, searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Outbound: local filter/search changes write back to the URL.
  // Intentionally omits searchParams from deps — inbound URL changes are handled above.
  useEffect(() => {
    const nextQs = buildCatalogQueryString(debouncedQuery, instrument, view);

    if (skipUrlWriteRef.current) {
      skipUrlWriteRef.current = false;
      // Keep lastSynced aligned with the state we just adopted from the URL
      // so a follow-up write (e.g. React Strict Mode) does not clobber it.
      lastSyncedQsRef.current = nextQs;
      return;
    }

    if (nextQs === lastSyncedQsRef.current) return;

    lastSyncedQsRef.current = nextQs;
    router.replace(nextQs ? `${pathname}?${nextQs}` : pathname, { scroll: false });
  }, [debouncedQuery, instrument, view, pathname, router]);

  useEffect(() => {
    if (searchOpen) setRecentSearches(getRecentSearches());
  }, [searchOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      // Panel is portaled to document.body — treat it as inside the search UI
      if (target instanceof Element && target.closest("[data-search-dropdown]")) {
        return;
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target)
      ) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Only auto-apply intent when the query itself implies an instrument/level.
  // Empty query must not clear a URL-driven instrument filter (e.g. footer Saham).
  useEffect(() => {
    if (!debouncedQuery.trim()) return;

    const intent = detectSearchIntent(debouncedQuery);
    if (intent.instrument) {
      setInstrument(intent.instrument as Instrument);
    }
    if (intent.level) {
      setLevel(intent.level as Level);
    }
  }, [debouncedQuery]);

  const navigateSearch = useCallback(
    (href: string, q?: string) => {
      if (q) saveRecentSearch(q);
      router.push(href);
      setSearchOpen(false);
    },
    [router]
  );

  function resetFilters() {
    setInstrument("Semua");
    setLevel("Semua");
    setSort("populer");
    setQuery("");
    setDebouncedQuery("");
    setView("kelas");
    // URL is cleared by the outbound sync effect — avoid a parallel replace race.
  }

  function resetSheetFilters() {
    setInstrument("Semua");
    setLevel("Semua");
    setSort("populer");
  }

  const activeFilterCount = useMemo(
    () => countActiveFilters(instrument, level, sort, view),
    [instrument, level, sort, view]
  );

  const filteredCourses = useMemo(() => {
    const base = courses.filter((course) => {
      if (instrument !== "Semua" && course.instrument !== instrument) return false;
      if (level !== "Semua" && course.level !== level) return false;
      const mentor = mentors.find((m) => m.slug === course.mentorSlug);
      return matchesQuery(course, mentor, queryTokens);
    });

    const sorted = [...base];
    if (sort === "rating") sorted.sort((a, b) => b.rating - a.rating);
    if (sort === "harga-rendah") sorted.sort((a, b) => a.price - b.price);
    if (sort === "harga-tinggi") sorted.sort((a, b) => b.price - a.price);
    if (sort === "populer") sorted.sort((a, b) => b.studentsCount - a.studentsCount);

    return sorted;
  }, [courses, instrument, level, queryTokens, mentors, sort]);

  const filteredMentors = useMemo(() => {
    return mentors.filter((mentor) => {
      if (instrument !== "Semua" && !mentor.instruments.includes(instrument)) return false;
      return matchesMentorQuery(mentor, queryTokens);
    });
  }, [mentors, instrument, queryTokens]);

  const resultHeading = debouncedQuery.trim()
    ? `Hasil untuk "${debouncedQuery.trim()}"`
    : null;

  const showGroupedCourseRows = useMemo(
    () =>
      !debouncedQuery.trim() &&
      instrument === "Semua" &&
      level === "Semua" &&
      sort === "populer",
    [debouncedQuery, instrument, level, sort]
  );

  const groupedCourseRows = useMemo(() => {
    if (!showGroupedCourseRows) return null;

    const popular = [...courses]
      .sort((a, b) => b.studentsCount - a.studentsCount)
      .slice(0, 10);

    const byInstrument = (inst: Instrument) =>
      courses.filter((c) => c.instrument === inst);

    return [
      { title: "Paling Populer", courses: popular },
      { title: "Saham", courses: byInstrument("Saham") },
      { title: "Crypto", courses: byInstrument("Crypto") },
      { title: "Forex", courses: byInstrument("Forex") },
    ].filter((row) => row.courses.length > 0);
  }, [courses, showGroupedCourseRows]);

  const showGroupedMentorRows = useMemo(
    () => !debouncedQuery.trim() && instrument === "Semua",
    [debouncedQuery, instrument]
  );

  const groupedMentorRows = useMemo(() => {
    if (!showGroupedMentorRows) return null;

    const topRated = [...mentors]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 8);

    const byInstrument = (inst: Instrument) =>
      mentors.filter((m) => m.instruments.includes(inst));

    return [
      { title: "Mentor Terbaik", mentors: topRated },
      { title: "Saham", mentors: byInstrument("Saham") },
      { title: "Crypto", mentors: byInstrument("Crypto") },
      { title: "Forex", mentors: byInstrument("Forex") },
    ].filter((row) => row.mentors.length > 0);
  }, [mentors, showGroupedMentorRows]);

  return (
    <div className="flex flex-col gap-6 md:gap-10">
      <Reveal>
        <motion.div
            className={cn(
              "surface-card catalog-filter-compact flex flex-col gap-2.5 bg-card p-3 md:gap-4 md:p-5",
              searchOpen && "relative z-40"
            )}
            transition={{ duration: 0.35, ease: easeOut }}
          >
            <div
              role="tablist"
              aria-label="Tampilan katalog"
              className="relative flex w-full rounded-full border border-border bg-white/[0.03] p-1 sm:w-fit"
            >
              {(["kelas", "instruktur"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={view === mode}
                  onClick={() => setView(mode)}
                  className={cn(
                    "w-1/2 rounded-full px-4 py-1.5 text-xs font-medium transition-colors sm:w-auto",
                    view === mode
                      ? "bg-primary text-primary-foreground shadow-[0_0_20px_var(--glow)]"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode === "kelas" ? "Kelas" : "Mentor"}
                </button>
              ))}
            </div>

            <div ref={searchContainerRef} className={cn("relative", searchOpen && "z-[100]")}>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-2xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm text-muted-foreground transition-colors focus-within:border-accent/25 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_3px_var(--glow)]",
                  searchOpen && "border-accent/25 bg-white/[0.05] shadow-[0_0_0_3px_var(--glow)]"
                )}
              >
                <Search className="size-4 shrink-0" />
                <div className="relative min-w-0 flex-1">
                  {!query && (
                    <SearchPlaceholderMarquee
                      text={
                        view === "kelas"
                          ? "Cari judul kelas, mentor, atau topik..."
                          : "Cari nama mentor atau spesialisasi..."
                      }
                    />
                  )}
                  <input
                    ref={searchInputRef}
                    type="search"
                    name="q"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSearchOpen(true);
                    }}
                    onFocus={() => setSearchOpen(true)}
                    placeholder=""
                    aria-label="Cari di katalog"
                    aria-expanded={searchOpen}
                    autoComplete="off"
                    className="w-full bg-transparent text-sm text-foreground outline-none"
                  />
                </div>
              </div>

              <SearchDropdown
                open={searchOpen}
                query={query}
                results={searchResults}
                trending={trending}
                popularCourses={popularCourses}
                popularMentors={popularMentors}
                recentSearches={recentSearches}
                activeIndex={activeIndex}
                onSelect={navigateSearch}
                onTrendingClick={(q) => {
                  setQuery(q);
                  setDebouncedQuery(q);
                  saveRecentSearch(q);
                  setSearchOpen(false);
                }}
                onActiveIndexChange={setActiveIndex}
                onRemoveRecent={(q) => {
                  removeRecentSearch(q);
                  setRecentSearches(getRecentSearches());
                }}
                onClearRecent={() => {
                  clearRecentSearches();
                  setRecentSearches([]);
                }}
              />
            </div>

            <div className="md:hidden">
              <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <SheetTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 w-full justify-between gap-2 rounded-2xl px-4"
                      aria-label={
                        activeFilterCount > 0
                          ? `Filter, ${activeFilterCount} aktif`
                          : "Filter katalog"
                      }
                    />
                  }
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="size-4" />
                    Filter
                  </span>
                  {activeFilterCount > 0 ? (
                    <Badge variant="accent" className="min-w-5 justify-center px-1.5">
                      {activeFilterCount}
                    </Badge>
                  ) : null}
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-2xl border-border/60 px-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
                >
                  <SheetHeader className="border-b border-border/60 px-4 pb-3 text-left">
                    <SheetTitle className="font-heading text-lg">Filter</SheetTitle>
                    <SheetDescription className="sr-only">
                      Atur instrumen, level, dan urutan katalog
                    </SheetDescription>
                  </SheetHeader>

                  <div className="px-4 py-4">
                    <CatalogFilterPanels
                      view={view}
                      instrument={instrument}
                      level={level}
                      sort={sort}
                      onInstrumentChange={setInstrument}
                      onLevelChange={setLevel}
                      onSortChange={setSort}
                      showLabels
                      touchFriendly
                    />
                  </div>

                  <SheetFooter className="flex-row gap-2 border-t border-border/60 px-4 pt-4">
                    {activeFilterCount > 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-11 flex-1"
                        onClick={resetSheetFilters}
                      >
                        Reset
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      className="min-h-11 flex-1"
                      onClick={() => setFilterSheetOpen(false)}
                    >
                      Terapkan
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>

            <div className="hidden md:block">
              <CatalogFilterPanels
                view={view}
                instrument={instrument}
                level={level}
                sort={sort}
                onInstrumentChange={setInstrument}
                onLevelChange={setLevel}
                onSortChange={setSort}
                showLabels
              />
            </div>
          </motion.div>
      </Reveal>

      <AnimatePresence mode="wait">
        {view === "kelas" ? (
          <SnapPresence
            key={`kelas-${instrument}-${level}-${sort}-${debouncedQuery}`}
            seed={11}
            className="relative z-0 block"
          >
            <h2 className="mb-3 font-heading text-lg font-semibold tracking-tight md:mb-4">
              {resultHeading ?? (
                filteredCourses.length > 0
                  ? `${filteredCourses.length} kelas ditemukan`
                  : "Tidak ada kelas yang cocok"
              )}
              {resultHeading && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  — {filteredCourses.length} kelas
                </span>
              )}
            </h2>
            {filteredCourses.length > 0 ? (
              <div className="catalog-section">
                {showGroupedCourseRows && groupedCourseRows ? (
                  groupedCourseRows.map((row) => (
                    <CatalogCourseRow
                      key={row.title}
                      title={row.title}
                      courses={row.courses}
                      enrollmentBySlug={enrollmentBySlug}
                    />
                  ))
                ) : (
                  <CatalogCourseRow
                    title={
                      resultHeading ??
                      `${filteredCourses.length} kelas ditemukan`
                    }
                    courses={filteredCourses}
                    count={filteredCourses.length}
                    enrollmentBySlug={enrollmentBySlug}
                  />
                )}
              </div>
            ) : (
              <div className="surface-card flex flex-col items-center gap-3 border-dashed py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  Tidak ada kelas untuk &ldquo;{debouncedQuery}&rdquo;. Coba kata kunci lain.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {trending.slice(0, 4).map((s) => (
                    <button
                      key={s.query}
                      type="button"
                      onClick={() => {
                        setQuery(s.query);
                        setDebouncedQuery(s.query);
                      }}
                      className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-accent/30 hover:text-foreground"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-medium underline-offset-4 hover:underline"
                >
                  Reset filter
                </button>
              </div>
            )}
          </SnapPresence>
        ) : (
          <SnapPresence
            key={`mentor-${instrument}-${debouncedQuery}`}
            seed={19}
            className="relative z-0 block"
          >
            <h2 className="mb-3 font-heading text-lg font-semibold tracking-tight md:mb-4">
              {resultHeading ?? (
                filteredMentors.length > 0
                  ? `${filteredMentors.length} mentor ditemukan`
                  : "Tidak ada mentor yang cocok"
              )}
              {resultHeading && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  — {filteredMentors.length} mentor
                </span>
              )}
            </h2>
            {filteredMentors.length > 0 ? (
              <div className="catalog-section">
                {showGroupedMentorRows && groupedMentorRows ? (
                  groupedMentorRows.map((row) => (
                    <CatalogMentorRow
                      key={row.title}
                      title={row.title}
                      mentors={row.mentors}
                    />
                  ))
                ) : (
                  <CatalogMentorRow
                    title={
                      resultHeading ??
                      `${filteredMentors.length} mentor ditemukan`
                    }
                    mentors={filteredMentors}
                    count={filteredMentors.length}
                  />
                )}
              </div>
            ) : (
              <div className="surface-card flex flex-col items-center gap-2 border-dashed py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  Tidak ada mentor pada kombinasi filter saat ini.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-medium underline-offset-4 hover:underline"
                >
                  Tampilkan semua mentor
                </button>
              </div>
            )}
          </SnapPresence>
        )}
      </AnimatePresence>
    </div>
  );
}

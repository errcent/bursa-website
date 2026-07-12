"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { CourseCard } from "@/components/course-card";
import { MentorCard } from "@/components/mentor-card";
import { PlaylistCard } from "@/components/playlist/playlist-card";
import {
  SCROLL_CAROUSEL_GAP,
  ScrollCarousel,
  catalogCourseGetScrollPerView,
  mentorGetScrollPerView,
} from "@/components/scroll-carousel";
import { Reveal } from "@/components/motion/reveal";
import { SnapPresence } from "@/components/motion/snap";
import { SearchDropdown } from "@/components/search/search-dropdown";
import { SearchPlaceholderMarquee } from "@/components/search/search-placeholder-marquee";
import { useMyLearning } from "@/hooks/use-my-learning";
import { courseEnrollmentFromLearning } from "@/lib/learning/enrollment";
import type { PlaylistSummary } from "@/lib/playlist/types";
import {
  getPopularCourses,
  getPopularMentors,
  getTrendingSuggestions,
  saveRecentSearch,
  searchAll,
} from "@/lib/search/engine";
import { cn } from "@/lib/utils";
import type { Course, Instrument, Mentor } from "@/lib/types";
import type { LearningCourseProgress } from "@/hooks/use-my-learning";

type ViewMode = "kelas" | "instruktur";

interface CatalogBrowserProps {
  courses: Course[];
  mentors: Mentor[];
  playlists: PlaylistSummary[];
  initialQuery?: string;
  initialView?: ViewMode;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

const INSTRUMENT_ROW_LABELS: Record<Instrument, string> = {
  Saham: "Saham",
  Crypto: "Cryptocurrency",
  Forex: "Foreign Exchange",
};

function parseViewParam(value: string | null): ViewMode {
  return value === "instruktur" ? "instruktur" : "kelas";
}

function buildCatalogQueryString(view: ViewMode): string {
  if (view === "kelas") return "";
  const params = new URLSearchParams();
  params.set("view", view);
  return params.toString();
}

type CatalogCourseRowProps = {
  title: string;
  courses: Course[];
  enrollmentBySlug: Map<string, LearningCourseProgress>;
};

function CatalogCourseRow({ title, courses, enrollmentBySlug }: CatalogCourseRowProps) {
  if (courses.length === 0) return null;

  return (
    <section className="catalog-row" aria-label={title}>
      <h3 className="catalog-row-title">{title}</h3>
      <div className="catalog-row-bleed md:hidden">
        <div className="catalog-row-scroll">
          {courses.map((course) => (
            <CourseCard
              key={course.slug}
              course={course}
              className="w-full"
              enrollment={courseEnrollmentFromLearning(enrollmentBySlug.get(course.slug))}
            />
          ))}
        </div>
      </div>
      <div className="catalog-row-bleed hidden md:block">
        <ScrollCarousel
          ariaLabel={title}
          getPerView={catalogCourseGetScrollPerView}
          gap={SCROLL_CAROUSEL_GAP}
        >
          {courses.map((course) => (
            <CourseCard
              key={course.slug}
              course={course}
              className="w-full"
              enrollment={courseEnrollmentFromLearning(enrollmentBySlug.get(course.slug))}
            />
          ))}
        </ScrollCarousel>
      </div>
    </section>
  );
}

function CatalogPlaylistRow({ title, playlists }: { title: string; playlists: PlaylistSummary[] }) {
  if (playlists.length === 0) return null;

  return (
    <section className="catalog-row" aria-label={title}>
      <h3 className="catalog-row-title">{title}</h3>
      <div className="catalog-row-bleed md:hidden">
        <div className="catalog-row-scroll">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} className="w-[min(100%,280px)]" />
          ))}
        </div>
      </div>
      <div className="catalog-row-bleed hidden md:block">
        <ScrollCarousel
          ariaLabel={title}
          getPerView={() => 3}
          gap={SCROLL_CAROUSEL_GAP}
        >
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} className="w-full" />
          ))}
        </ScrollCarousel>
      </div>
    </section>
  );
}

function CatalogMentorRow({ title, mentors }: { title: string; mentors: Mentor[] }) {
  if (mentors.length === 0) return null;

  return (
    <section className="catalog-row" aria-label={title}>
      <h3 className="catalog-row-title">{title}</h3>
      <div className="catalog-row-bleed md:hidden">
        <div className="catalog-row-scroll catalog-row-scroll--mentor">
          {mentors.map((mentor) => (
            <MentorCard key={mentor.slug} mentor={mentor} variant="compact" />
          ))}
        </div>
      </div>
      <div className="catalog-row-bleed hidden md:block">
        <ScrollCarousel
          ariaLabel={title}
          getPerView={mentorGetScrollPerView}
          gap={SCROLL_CAROUSEL_GAP}
        >
          {mentors.map((mentor) => (
            <MentorCard key={mentor.slug} mentor={mentor} className="h-full w-full" />
          ))}
        </ScrollCarousel>
      </div>
    </section>
  );
}

export function CatalogBrowser({
  courses,
  mentors,
  playlists,
  initialQuery = "",
  initialView = "kelas",
}: CatalogBrowserProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [view, setView] = useState<ViewMode>(initialView);
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const skipUrlWriteRef = useRef(true);
  const lastSyncedQsRef = useRef(buildCatalogQueryString(initialView));

  const { bySlug: enrollmentBySlug, courses: learningCourses, isAuthenticated } = useMyLearning();

  const trending = useMemo(() => getTrendingSuggestions(), []);
  const popularCourses = useMemo(() => getPopularCourses(3), []);
  const popularMentors = useMemo(() => getPopularMentors(2), []);

  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const all = searchAll(debouncedQuery, 8);
    if (view === "kelas") {
      return all.filter((r) => r.type === "course" || r.type === "topic");
    }
    return all.filter((r) => r.type === "mentor");
  }, [debouncedQuery, view]);

  const searchPanelOpen = searchFocused && debouncedQuery.trim().length > 0;

  const urlQs = searchParams.toString();

  useEffect(() => {
    if (urlQs === lastSyncedQsRef.current) return;

    const nextView = parseViewParam(searchParams.get("view"));
    const nextQuery = searchParams.get("q")?.trim() ?? "";

    lastSyncedQsRef.current = urlQs;
    skipUrlWriteRef.current = true;

    setView(nextView);
    if (nextQuery) {
      setQuery(nextQuery);
      setDebouncedQuery(nextQuery);
      setSearchFocused(true);
    }
  }, [urlQs, searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const nextQs = buildCatalogQueryString(view);

    if (skipUrlWriteRef.current) {
      skipUrlWriteRef.current = false;
      lastSyncedQsRef.current = nextQs;
      return;
    }

    if (nextQs === lastSyncedQsRef.current) return;

    lastSyncedQsRef.current = nextQs;
    router.replace(nextQs ? `${pathname}?${nextQs}` : pathname, { scroll: false });
  }, [view, pathname, router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (target instanceof Element && target.closest("[data-search-dropdown]")) {
        return;
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target)
      ) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigateSearch = useCallback(
    (href: string, q?: string) => {
      if (q) saveRecentSearch(q);
      router.push(href);
      setSearchFocused(false);
    },
    [router]
  );

  const continueWatchingCourses = useMemo(() => {
    if (!isAuthenticated) return [];
    const inProgressSlugs = learningCourses
      .filter((c) => c.progressPercent > 0 && c.progressPercent < 100)
      .map((c) => c.slug);
    const courseBySlug = new Map(courses.map((c) => [c.slug, c]));
    return inProgressSlugs
      .map((slug) => courseBySlug.get(slug))
      .filter((c): c is Course => Boolean(c));
  }, [courses, isAuthenticated, learningCourses]);

  const newCourses = useMemo(
    () =>
      [...courses]
        .sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 10),
    [courses]
  );

  const instrumentCourseRows = useMemo(() => {
    const byInstrument = (inst: Instrument) =>
      courses.filter((c) => c.instrument === inst);

    return (["Saham", "Crypto", "Forex"] as Instrument[]).map((inst) => ({
      title: INSTRUMENT_ROW_LABELS[inst],
      courses: byInstrument(inst),
    }));
  }, [courses]);

  const groupedMentorRows = useMemo(() => {
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
  }, [mentors]);

  return (
    <div className="flex min-w-0 flex-col gap-6 md:gap-10">
      <Reveal>
        <motion.div
          className={cn(
            "surface-card catalog-filter-compact flex flex-col gap-2.5 bg-card p-3 md:gap-4 md:p-5",
            searchPanelOpen && "relative z-40"
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
                onClick={() => {
                  setView(mode);
                  setActiveIndex(-1);
                }}
                className={cn(
                  "w-1/2 rounded-full px-4 py-1.5 text-xs font-medium transition-colors sm:w-auto",
                  view === mode
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_var(--glow)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode === "kelas" ? "Cari kelas" : "Cari mentor"}
              </button>
            ))}
          </div>

          <div
            ref={searchContainerRef}
            className={cn("relative", searchPanelOpen && "z-[100]")}
          >
            <div
              className={cn(
                "flex items-center gap-2 rounded-2xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm text-muted-foreground transition-colors focus-within:border-accent/25 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_3px_var(--glow)]",
                searchPanelOpen &&
                  "border-accent/25 bg-white/[0.05] shadow-[0_0_0_3px_var(--glow)]"
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
                  type="search"
                  name="q"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(-1);
                  }}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => {
                    window.setTimeout(() => {
                      if (
                        !searchContainerRef.current?.contains(document.activeElement)
                      ) {
                        setSearchFocused(false);
                      }
                    }, 120);
                  }}
                  placeholder=""
                  aria-label="Cari di katalog"
                  aria-expanded={searchPanelOpen}
                  autoComplete="off"
                  className="w-full bg-transparent text-base text-foreground outline-none sm:text-sm"
                />
              </div>
            </div>

            <SearchDropdown
              open={searchPanelOpen}
              query={query}
              results={searchResults}
              trending={trending}
              popularCourses={popularCourses}
              popularMentors={popularMentors}
              recentSearches={[]}
              activeIndex={activeIndex}
              onSelect={navigateSearch}
              onTrendingClick={(q) => setQuery(q)}
              onActiveIndexChange={setActiveIndex}
              queryOnly
              hideViewAll
            />
          </div>
        </motion.div>
      </Reveal>

      <AnimatePresence mode="wait">
        {view === "kelas" ? (
          <SnapPresence key="kelas" seed={11} className="relative z-0 block">
            <div className="catalog-section">
              <CatalogCourseRow
                title="Lanjutkan Menonton"
                courses={continueWatchingCourses}
                enrollmentBySlug={enrollmentBySlug}
              />
              <CatalogCourseRow
                title="Baru di Bursa"
                courses={newCourses}
                enrollmentBySlug={enrollmentBySlug}
              />
              <CatalogPlaylistRow title="Playlists" playlists={playlists} />
              {instrumentCourseRows.map((row) => (
                <CatalogCourseRow
                  key={row.title}
                  title={row.title}
                  courses={row.courses}
                  enrollmentBySlug={enrollmentBySlug}
                />
              ))}
            </div>
          </SnapPresence>
        ) : (
          <SnapPresence key="mentor" seed={19} className="relative z-0 block">
            <div className="catalog-section">
              {groupedMentorRows.map((row) => (
                <CatalogMentorRow
                  key={row.title}
                  title={row.title}
                  mentors={row.mentors}
                />
              ))}
            </div>
          </SnapPresence>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "motion/react";

import { CatalogCarouselRow } from "@/components/catalog-carousel-row";
import { CatalogCourseRow } from "@/components/catalog-course-row";
import { LazyWhenVisible } from "@/components/lazy-when-visible";
import { LearningGuidanceEntry } from "@/components/learning-guidance/learning-guidance-entry";
import { MentorCard } from "@/components/mentor-card";
import { PlaylistCard } from "@/components/playlist/playlist-card";
import {
  catalogPlaylistGetScrollPerView,
  mentorGetScrollPerView,
} from "@/components/scroll-carousel";
import { SnapPresence } from "@/components/motion/snap";
import { useMyLearning } from "@/hooks/use-my-learning";
import { rankCoursesByQuality } from "@/lib/catalog/ranking";
import type { PlaylistSummary } from "@/lib/playlist/types";
import type { Course, Instrument, Mentor } from "@/lib/types";

type ViewMode = "kelas" | "instruktur";

interface CatalogBrowserProps {
  courses: Course[];
  mentors: Mentor[];
  playlists: PlaylistSummary[];
  initialView?: ViewMode;
}

const INSTRUMENT_ROW_LABELS: Record<Instrument, string> = {
  Saham: "Saham",
  Crypto: "Kripto",
  Forex: "Valas/Forex",
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

function CatalogPlaylistRow({ title, playlists }: { title: string; playlists: PlaylistSummary[] }) {
  if (playlists.length === 0) return null;

  return (
    <CatalogCarouselRow
      title={title}
      getPerView={catalogPlaylistGetScrollPerView}
      carouselDensity="playlist"
      mobileScrollClassName="catalog-row-scroll catalog-row-scroll--playlist"
      prevLabel="Playlist sebelumnya"
      nextLabel="Playlist berikutnya"
    >
      {playlists.map((playlist) => (
        <PlaylistCard key={playlist.id} playlist={playlist} className="w-full" variant="catalog" />
      ))}
    </CatalogCarouselRow>
  );
}

function CatalogMentorRow({ title, mentors }: { title: string; mentors: Mentor[] }) {
  if (mentors.length === 0) return null;

  return (
    <CatalogCarouselRow
      title={title}
      getPerView={mentorGetScrollPerView}
      carouselDensity="mentor"
      mobileScrollClassName="catalog-row-scroll catalog-row-scroll--mentor"
      prevLabel="Mentor sebelumnya"
      nextLabel="Mentor berikutnya"
    >
      {mentors.map((mentor) => (
        <MentorCard key={mentor.slug} mentor={mentor} variant="catalog" className="h-full w-full" />
      ))}
    </CatalogCarouselRow>
  );
}

export function CatalogBrowser({
  courses,
  mentors,
  playlists,
  initialView = "kelas",
}: CatalogBrowserProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [view, setView] = useState<ViewMode>(initialView);

  const skipUrlWriteRef = useRef(true);
  const lastSyncedQsRef = useRef(buildCatalogQueryString(initialView));

  const { bySlug: enrollmentBySlug, courses: learningCourses, isAuthenticated } = useMyLearning();

  const mentorBySlug = useMemo(
    () => new Map(mentors.map((mentor) => [mentor.slug, mentor])),
    [mentors]
  );

  const urlQs = searchParams.toString();

  useEffect(() => {
    if (urlQs === lastSyncedQsRef.current) return;

    const nextView = parseViewParam(searchParams.get("view"));

    lastSyncedQsRef.current = urlQs;
    skipUrlWriteRef.current = true;

    setView(nextView);
  }, [urlQs, searchParams]);

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

  const instrumentCourseRows = useMemo(() => {
    const byInstrument = (inst: Instrument) =>
      rankCoursesByQuality(
        courses.filter((c) => c.instrument === inst),
        mentorBySlug
      );

    return (["Saham", "Crypto", "Forex"] as Instrument[]).map((inst) => ({
      title: INSTRUMENT_ROW_LABELS[inst],
      courses: byInstrument(inst),
    }));
  }, [courses, mentorBySlug]);

  const groupedMentorRows = useMemo(() => {
    const topRated = [...mentors]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 8);

    const byInstrument = (inst: Instrument) =>
      mentors.filter((m) => m.instruments.includes(inst));

    return [
      { title: "Mentor Terbaik", mentors: topRated },
      { title: "Saham", mentors: byInstrument("Saham") },
      { title: "Kripto", mentors: byInstrument("Crypto") },
      { title: "Valas/Forex", mentors: byInstrument("Forex") },
    ].filter((row) => row.mentors.length > 0);
  }, [mentors]);

  return (
    <div className="flex min-w-0 flex-col gap-6 md:gap-10">
      <AnimatePresence mode="wait">
        {view === "kelas" ? (
          <SnapPresence key="kelas" seed={11} className="relative z-0 block">
            <div className="catalog-section">
              <CatalogCourseRow
                title="Lanjutkan Menonton"
                courses={continueWatchingCourses}
                enrollmentBySlug={enrollmentBySlug}
                mentorBySlug={mentorBySlug}
                cardVariant="catalog"
              />
              <CatalogPlaylistRow title="Playlist" playlists={playlists} />
              {instrumentCourseRows.map((row) => (
                <LazyWhenVisible key={row.title} minHeight={300}>
                  <CatalogCourseRow
                    title={row.title}
                    courses={row.courses}
                    enrollmentBySlug={enrollmentBySlug}
                    mentorBySlug={mentorBySlug}
                    cardVariant="catalog"
                  />
                </LazyWhenVisible>
              ))}
            </div>
          </SnapPresence>
        ) : (
          <SnapPresence key="mentor" seed={19} className="relative z-0 block">
            <div className="catalog-section">
              {groupedMentorRows.map((row) => (
                <LazyWhenVisible key={row.title} minHeight={280}>
                  <CatalogMentorRow title={row.title} mentors={row.mentors} />
                </LazyWhenVisible>
              ))}
            </div>
          </SnapPresence>
        )}
      </AnimatePresence>

      <LearningGuidanceEntry />
    </div>
  );
}

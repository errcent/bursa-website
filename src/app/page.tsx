import { HomePageContent } from "@/components/home-page-content";
import { getCatalogData, getCourseBySlug } from "@/lib/catalog/server";
import {
  findCuratedPlaylistBySlug,
  serializePlaylistDetail,
} from "@/lib/playlist/server";
import type { Metadata } from "next";

export const revalidate = 60;

const DEMO_PLAYLIST_SLUG = "teknikal-swing-trading";
const DEMO_COURSE_FALLBACK_SLUG = "swing-trading-teknikal-dasar";
const DEMO_LESSON_LEGACY_ID = "l2";

export const metadata: Metadata = {
  title: "Belajar Trading Terstruktur",
  description:
    "Belajar trading lewat katalog mentor dan kelas terstruktur. Bursa adalah platform edukasi, bukan broker.",
};

export default async function HomePage() {
  const { courses, mentors, playlists } = await getCatalogData();

  const rawPlaylist = await findCuratedPlaylistBySlug(DEMO_PLAYLIST_SLUG);
  const demoPlaylist = rawPlaylist ? serializePlaylistDetail(rawPlaylist) : null;

  const preferredItem =
    demoPlaylist?.items.find((item) => item.lessonLegacyId === DEMO_LESSON_LEGACY_ID) ??
    demoPlaylist?.items.find((item) => item.courseSlug === DEMO_COURSE_FALLBACK_SLUG) ??
    demoPlaylist?.items[0] ??
    null;

  const workspaceCourseSlug =
    preferredItem?.courseSlug ?? DEMO_COURSE_FALLBACK_SLUG;
  const curriculumCourse = await getCourseBySlug(workspaceCourseSlug);
  const curriculumMentor = curriculumCourse
    ? mentors.find((m) => m.slug === curriculumCourse.mentorSlug) ?? null
    : null;
  const preferredLessonLegacyId =
    preferredItem?.lessonLegacyId ?? DEMO_LESSON_LEGACY_ID;

  return (
    <HomePageContent
      courses={courses}
      mentors={mentors}
      playlists={playlists}
      demoPlaylist={demoPlaylist}
      curriculumCourse={curriculumCourse}
      curriculumMentor={curriculumMentor}
      preferredLessonLegacyId={preferredLessonLegacyId}
    />
  );
}

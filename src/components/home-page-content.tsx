import { ClosingCtaSection } from "@/components/home/closing-cta-section";
import { DeviceMockupSection } from "@/components/home/device-mockup-section";
import { HomeDiscoverSection } from "@/components/home/home-discover-section";
import { HomeFaqSection } from "@/components/home/home-faq-section";
import { HomeHeroSection } from "@/components/home/home-hero-section";
import { HomeProblemSection } from "@/components/home/home-problem-section";
import { HomeSolutionSection } from "@/components/home/home-solution-section";
import { LandingViewTracker } from "@/components/analytics/landing-view-tracker";
import { SiteFooter } from "@/components/site-footer";
import type { PlaylistDetail, PlaylistSummary } from "@/lib/playlist/types";
import type { Course, Mentor } from "@/lib/types";
import { Suspense } from "react";

export function HomePageContent({
  courses,
  mentors,
  playlists,
  demoPlaylist,
  curriculumCourse,
  curriculumMentor,
  preferredLessonLegacyId,
}: {
  courses: Course[];
  mentors: Mentor[];
  playlists: PlaylistSummary[];
  demoPlaylist: PlaylistDetail | null;
  curriculumCourse?: Course | null;
  curriculumMentor?: Mentor | null;
  preferredLessonLegacyId?: string | null;
}) {
  /** Dense mockup catalog needs full rows like /katalog, not soft-launch featured cap. */
  const catalogCourses = [...courses].sort((a, b) => b.studentsCount - a.studentsCount);

  return (
    <>
      <Suspense fallback={null}>
        <LandingViewTracker page="/" />
      </Suspense>
      <main className="landing-page has-mobile-sticky-cta flex-1 overflow-x-clip">
        <HomeHeroSection />

        <HomeProblemSection />

        <HomeSolutionSection />

        <section id="kelas-unggulan" className="section-loose scroll-mt-24">
          <div className="container-page">
            <HomeDiscoverSection playlists={playlists} />
          </div>
        </section>

        <DeviceMockupSection
          playlist={demoPlaylist}
          catalogPlaylists={playlists}
          catalogCourses={catalogCourses}
          course={curriculumCourse ?? null}
          mentor={curriculumMentor ?? null}
          preferredLessonLegacyId={preferredLessonLegacyId ?? null}
          mentors={mentors}
        />

        <HomeFaqSection />

        <ClosingCtaSection />
      </main>
      <SiteFooter />
    </>
  );
}

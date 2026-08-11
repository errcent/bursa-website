import { ClosingCtaSection } from "@/components/home/closing-cta-section";
import { DeviceMockupSection } from "@/components/home/device-mockup-section";
import { HomeDiscoverSection } from "@/components/home/home-discover-section";
import { HomeFaqSection } from "@/components/home/home-faq-section";
import { HomeHeroSection } from "@/components/home/home-hero-section";
import { HomeProblemSection } from "@/components/home/home-problem-section";
import { HomeSolutionSection } from "@/components/home/home-solution-section";
import { LandingViewTracker } from "@/components/analytics/landing-view-tracker";
import { SiteFooter } from "@/components/site-footer";
import { capSoftLaunchCourses } from "@/lib/decision-os/soft-launch";
import type { Course, Mentor } from "@/lib/types";
import { Suspense } from "react";

export function HomePageContent({
  courses,
  mentors,
  curriculumCourse,
  curriculumMentor,
}: {
  courses: Course[];
  mentors: Mentor[];
  curriculumCourse?: Course | null;
  curriculumMentor?: Mentor | null;
}) {
  const featuredCourses = capSoftLaunchCourses(
    [...courses].sort((a, b) => b.studentsCount - a.studentsCount)
  );

  const totalStudents = courses.reduce((sum, course) => sum + course.studentsCount, 0);

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
            <HomeDiscoverSection
              courses={featuredCourses}
              mentors={mentors}
              totalStudents={totalStudents}
            />
          </div>
        </section>

        <DeviceMockupSection
          course={curriculumCourse ?? null}
          mentor={curriculumMentor ?? null}
          catalogCourses={featuredCourses}
          mentors={mentors}
        />

        <HomeFaqSection />

        <ClosingCtaSection />
      </main>
      <SiteFooter />
    </>
  );
}

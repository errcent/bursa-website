import { ClosingCtaSection } from "@/components/home/closing-cta-section";
import { DeviceMockupSection } from "@/components/home/device-mockup-section";
import { HomeDiscoverSection } from "@/components/home/home-discover-section";
import { HomeFaqSection } from "@/components/home/home-faq-section";
import { HomeHeroSection } from "@/components/home/home-hero-section";
import { HomeProblemSection } from "@/components/home/home-problem-section";
import { HomeSolutionSection } from "@/components/home/home-solution-section";
import { LandingAccentRun } from "@/components/home/landing-accent-run";
import { LandingViewTracker } from "@/components/analytics/landing-view-tracker";
import { SiteFooter } from "@/components/site-footer";
import type { PlaylistSummary } from "@/lib/playlist/types";
import { Suspense } from "react";

export function HomePageContent({
  playlists,
}: {
  playlists: PlaylistSummary[];
}) {
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

        <LandingAccentRun pin={<DeviceMockupSection />} waitlist={<ClosingCtaSection />}>
          <HomeFaqSection />
        </LandingAccentRun>
      </main>
      <SiteFooter />
    </>
  );
}

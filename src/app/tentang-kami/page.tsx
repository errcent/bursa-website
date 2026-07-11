import type { Metadata } from "next";

import { AboutPageContent } from "@/components/about/about-page-content";
import { InfoPageHero } from "@/components/info-page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { aboutHero } from "@/lib/about/content";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description: aboutHero.description,
};

export default function TentangKamiPage() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <InfoPageHero
          eyebrow={aboutHero.eyebrow}
          title={aboutHero.title}
          description={aboutHero.description}
        />
        <AboutPageContent />
      </main>
      <SiteFooter />
    </>
  );
}

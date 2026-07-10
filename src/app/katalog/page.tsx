import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";

import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { CatalogBrowser } from "@/components/catalog-browser";
import { KatalogHero } from "@/components/katalog-hero";
import { courses, mentors } from "@/lib/mock-data";
import { buildSearchMetadata, buildSearchResultsJsonLd } from "@/lib/search/seo";
import type { Instrument } from "@/lib/types";

const validInstruments: Instrument[] = ["Saham", "Crypto", "Forex"];
const validViews = ["kelas", "instruktur"] as const;
type CatalogView = (typeof validViews)[number];

interface KatalogPageProps {
  searchParams: Promise<{ instrumen?: string; q?: string; view?: string }>;
}

export async function generateMetadata({ searchParams }: KatalogPageProps): Promise<Metadata> {
  const params = await searchParams;
  return buildSearchMetadata(params.q);
}

export default async function KatalogPage({ searchParams }: KatalogPageProps) {
  const params = await searchParams;
  const initialInstrument = validInstruments.includes(params.instrumen as Instrument)
    ? (params.instrumen as Instrument)
    : "Semua";
  const initialQuery = params.q?.trim() ?? "";
  const initialView: CatalogView = validViews.includes(params.view as CatalogView)
    ? (params.view as CatalogView)
    : "kelas";

  const searchJsonLd = initialQuery ? buildSearchResultsJsonLd(initialQuery) : null;

  return (
    <>
      {searchJsonLd && (
        <Script
          id="jsonld-search-results"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(searchJsonLd) }}
        />
      )}
      <SiteNavbar />
      <main className="has-mobile-sticky-cta flex-1 pb-6">
        <KatalogHero query={initialQuery} />
        <div className="container-page py-4 sm:py-10">
          <Suspense fallback={null}>
            <CatalogBrowser
              courses={courses}
              mentors={mentors}
              initialInstrument={initialInstrument}
              initialQuery={initialQuery}
              initialView={initialView}
            />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";

import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { CatalogBrowserSkeleton } from "@/components/catalog-browser-skeleton";
import { CatalogDataLoader } from "@/components/catalog-data-loader";
import { KatalogHero } from "@/components/katalog-hero";
import { buildSearchMetadata, buildSearchResultsJsonLd } from "@/lib/search/seo";

export const revalidate = 60;

const validViews = ["kelas", "instruktur"] as const;
type CatalogView = (typeof validViews)[number];

interface KatalogPageProps {
  searchParams: Promise<{ q?: string; view?: string }>;
}

export async function generateMetadata({ searchParams }: KatalogPageProps): Promise<Metadata> {
  const params = await searchParams;
  return buildSearchMetadata(params.q);
}

export default async function KatalogPage({ searchParams }: KatalogPageProps) {
  const params = await searchParams;
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
      <main className="has-mobile-sticky-cta flex-1 overflow-x-clip pb-6">
        <KatalogHero />
        <div className="container-page py-4 sm:py-10">
          <Suspense fallback={<CatalogBrowserSkeleton />}>
            <CatalogDataLoader
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

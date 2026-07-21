import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";

import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { CatalogBrowserSkeleton } from "@/components/catalog-browser-skeleton";
import { CatalogDataLoader } from "@/components/catalog-data-loader";
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

  const searchJsonLd = initialQuery ? await buildSearchResultsJsonLd(initialQuery) : null;

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
      <main className="catalog-page flex-1 overflow-x-clip pb-6">
        <div className="container-page pt-4 sm:pt-6">
          <Suspense fallback={<CatalogBrowserSkeleton />}>
            <CatalogDataLoader initialView={initialView} />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

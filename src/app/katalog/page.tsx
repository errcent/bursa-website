import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { CatalogBrowserSkeleton } from "@/components/catalog-browser-skeleton";
import { CatalogDataLoader } from "@/components/catalog-data-loader";
import { JsonLdScript } from "@/components/json-ld-script";
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
      {searchJsonLd && <JsonLdScript id="jsonld-search-results" data={searchJsonLd} />}
      <SiteNavbar />
      <main className="catalog-page flex-1 overflow-x-clip pb-6">
        <div className="container-page pt-4 sm:pt-6">
          <header className="mb-5 sm:mb-6">
            <p className="eyebrow mb-1.5">Katalog</p>
            <h1 className="font-display text-2xl tracking-[-0.02em] text-foreground sm:text-3xl">
              Kelas &amp; mentor trading
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Jelajahi kurikulum terstruktur. Saat siap, gabung waitlist untuk dibuka lebih dulu.
            </p>
          </header>
          <Suspense fallback={<CatalogBrowserSkeleton />}>
            <CatalogDataLoader initialView={initialView} />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

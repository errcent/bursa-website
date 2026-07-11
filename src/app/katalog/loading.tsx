import { CatalogBrowserSkeleton } from "@/components/catalog-browser-skeleton";
import { KatalogHero } from "@/components/katalog-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";

export default function KatalogLoading() {
  return (
    <>
      <SiteNavbar />
      <main className="has-mobile-sticky-cta flex-1 overflow-x-clip pb-6">
        <KatalogHero />
        <div className="container-page py-4 sm:py-10">
          <CatalogBrowserSkeleton />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

import { CatalogBrowserSkeleton } from "@/components/catalog-browser-skeleton";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";

export default function KatalogLoading() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1 overflow-x-clip pb-6">
        <div className="container-page pt-4 sm:pt-6">
          <CatalogBrowserSkeleton />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

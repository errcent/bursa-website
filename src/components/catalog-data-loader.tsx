import { CatalogBrowser } from "@/components/catalog-browser";
import { getCatalogData } from "@/lib/catalog/server";

type CatalogView = "kelas" | "instruktur";

interface CatalogDataLoaderProps {
  initialQuery: string;
  initialView: CatalogView;
}

export async function CatalogDataLoader({
  initialQuery,
  initialView,
}: CatalogDataLoaderProps) {
  const { courses, mentors, playlists } = await getCatalogData();

  return (
    <CatalogBrowser
      courses={courses}
      mentors={mentors}
      playlists={playlists}
      initialQuery={initialQuery}
      initialView={initialView}
    />
  );
}

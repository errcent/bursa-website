import { CatalogBrowser } from "@/components/catalog-browser";
import { getCatalogData } from "@/lib/catalog/server";
import type { Instrument } from "@/lib/types";

type CatalogView = "kelas" | "instruktur";

interface CatalogDataLoaderProps {
  initialInstrument: Instrument | "Semua";
  initialQuery: string;
  initialView: CatalogView;
}

export async function CatalogDataLoader({
  initialInstrument,
  initialQuery,
  initialView,
}: CatalogDataLoaderProps) {
  const { courses, mentors } = await getCatalogData();

  return (
    <CatalogBrowser
      courses={courses}
      mentors={mentors}
      initialInstrument={initialInstrument}
      initialQuery={initialQuery}
      initialView={initialView}
    />
  );
}

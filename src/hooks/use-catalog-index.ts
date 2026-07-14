"use client";

import { useEffect, useState } from "react";

import type { SearchCatalogIndex } from "@/lib/search/engine";
import type { Course, Mentor } from "@/lib/types";

type CatalogIndexPayload = {
  courses: Course[];
  mentors: Mentor[];
};

let cachedIndex: SearchCatalogIndex | null = null;
let inflight: Promise<SearchCatalogIndex> | null = null;

async function fetchCatalogIndex(): Promise<SearchCatalogIndex> {
  if (cachedIndex) return cachedIndex;
  if (inflight) return inflight;

  inflight = fetch("/api/catalog", { cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as CatalogIndexPayload;
      cachedIndex = {
        courses: data.courses ?? [],
        mentors: data.mentors ?? [],
      };
      return cachedIndex;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/** Loads the public catalog listing once for client-side search and recommendations. */
export function useCatalogIndex() {
  const [index, setIndex] = useState<SearchCatalogIndex | null>(cachedIndex);
  const [loading, setLoading] = useState(!cachedIndex);

  useEffect(() => {
    if (cachedIndex) {
      setIndex(cachedIndex);
      setLoading(false);
      return;
    }

    let cancelled = false;

    void fetchCatalogIndex()
      .then((data) => {
        if (!cancelled) setIndex(data);
      })
      .catch(() => {
        if (!cancelled) setIndex({ courses: [], mentors: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { index, loading };
}

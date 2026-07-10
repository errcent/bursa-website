import { useEffect, useRef, useState } from "react";

import { searchAll, type SearchResult } from "@/lib/search/engine";

const DEFAULT_DELAY_MS = 300;

/**
 * Debounces search input and discards stale computation when the query changes
 * before the debounce window elapses.
 */
export function useDebouncedSearch(
  query: string,
  limit = 8,
  delay = DEFAULT_DELAY_MS
): { debouncedQuery: string; results: SearchResult[] } {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [results, setResults] = useState<SearchResult[]>(() =>
    query.trim() ? searchAll(query, limit) : []
  );
  const generationRef = useRef(0);

  useEffect(() => {
    const generation = ++generationRef.current;

    const timer = window.setTimeout(() => {
      if (generation !== generationRef.current) return;

      setDebouncedQuery(query);

      const trimmed = query.trim();
      const nextResults = trimmed ? searchAll(query, limit) : [];
      if (generation !== generationRef.current) return;

      setResults(nextResults);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, limit, delay]);

  return { debouncedQuery, results };
}

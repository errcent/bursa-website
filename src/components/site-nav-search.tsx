"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { SearchDropdown } from "@/components/search/search-dropdown";
import { SearchPlaceholderMarquee } from "@/components/search/search-placeholder-marquee";
import {
  buildCatalogSearchUrl,
  clearRecentSearches,
  getPopularCourses,
  getPopularMentors,
  getRecentSearches,
  getTrendingSuggestions,
  removeRecentSearch,
  saveRecentSearch,
} from "@/lib/search/engine";
import { useDebouncedSearch } from "@/lib/search/use-debounced-search";
import { useCatalogIndex } from "@/hooks/use-catalog-index";
import { cn } from "@/lib/utils";

interface SiteNavSearchProps {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  onNavigate?: () => void;
  /** When false, closes the dropdown and blocks interaction (hero docked nav). */
  reveal?: boolean;
  /** When false, skip opening the dropdown on input focus (e.g. mobile sheet autofocus). */
  openOnFocus?: boolean;
  /** Start with dropdown open and focus input (mobile overlay mount). */
  initialOpen?: boolean;
  /** Called when the dropdown closes via escape or outside click. */
  onDismiss?: () => void;
}

export function SiteNavSearch({
  className,
  inputClassName,
  placeholder = "Cari kelas, mentor, atau topik...",
  onNavigate,
  reveal = true,
  openOnFocus = true,
  initialOpen = false,
  onDismiss,
}: SiteNavSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listboxId = useId();

  const [value, setValue] = useState("");
  const [open, setOpen] = useState(initialOpen);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trending = useMemo(() => getTrendingSuggestions(), []);
  const { index: catalogIndex } = useCatalogIndex();
  const popularCourses = useMemo(
    () => (catalogIndex ? getPopularCourses(catalogIndex, 3) : []),
    [catalogIndex]
  );
  const popularMentors = useMemo(
    () => (catalogIndex ? getPopularMentors(catalogIndex, 2) : []),
    [catalogIndex]
  );

  const { results } = useDebouncedSearch(value, catalogIndex, 8);

  useEffect(() => {
    if (pathname === "/katalog") {
      setValue(searchParams.get("q") ?? "");
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    if (open) setRecentSearches(getRecentSearches());
  }, [open]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [value, open]);

  useEffect(() => {
    if (reveal) return;
    setOpen(false);
    inputRef.current?.blur();
  }, [reveal]);

  useLayoutEffect(() => {
    if (!initialOpen || !reveal) return;
    inputRef.current?.focus();
  }, [initialOpen, reveal]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      // Panel is portaled to document.body — treat it as inside the search UI
      if (
        target instanceof Element &&
        target.closest("[data-search-dropdown]")
      ) {
        return;
      }
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
        onDismiss?.();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onDismiss]);

  const navigate = useCallback(
    (href: string, query?: string) => {
      if (query) saveRecentSearch(query);
      router.push(href);
      setOpen(false);
      onNavigate?.();
    },
    [router, onNavigate]
  );

  function getFlatNavigableItems() {
    if (value.trim()) {
      if (results.length > 0) return results.map((r) => r.href);
      return [buildCatalogSearchUrl(value)];
    }
    return [
      ...recentSearches.map((q) => buildCatalogSearchUrl(q)),
      ...popularCourses.map((r) => r.href),
      ...popularMentors.map((r) => r.href),
    ];
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = value.trim();
    if (activeIndex >= 0) {
      const items = getFlatNavigableItems();
      if (items[activeIndex]) {
        navigate(items[activeIndex], q || undefined);
        return;
      }
    }
    if (q) saveRecentSearch(q);
    navigate(buildCatalogSearchUrl(q), q || undefined);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const items = getFlatNavigableItems();

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      onDismiss?.();
    } else if (event.key === "Enter" && activeIndex >= 0 && items[activeIndex]) {
      event.preventDefault();
      navigate(items[activeIndex], value.trim() || undefined);
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative", open && reveal && "z-[210]", className)}
      aria-hidden={!reveal}
    >
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-center gap-2 rounded-full border border-border bg-white/[0.03] px-3 py-1.5 text-sm text-muted-foreground transition-[opacity,transform,border-color,background-color,box-shadow] duration-300 ease-out focus-within:border-accent/20 focus-within:bg-white/[0.05] focus-within:text-foreground focus-within:shadow-[0_0_0_3px_var(--glow)]",
          open && reveal && "border-accent/25 bg-white/[0.05] shadow-[0_0_0_3px_var(--glow)]",
          !reveal && "pointer-events-none opacity-0"
        )}
        role="search"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <div className="relative min-w-0 flex-1">
          {!value && <SearchPlaceholderMarquee text={placeholder} />}
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (reveal) setOpen(true);
            }}
            onFocus={() => reveal && openOnFocus && setOpen(true)}
            onClick={() => reveal && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder=""
            aria-label={placeholder}
            aria-expanded={open && reveal}
            aria-controls={listboxId}
            aria-autocomplete="list"
            autoComplete="off"
            tabIndex={reveal ? 0 : -1}
            className={cn(
              "w-full min-w-0 bg-transparent text-base text-foreground outline-none sm:text-sm",
              inputClassName
            )}
          />
        </div>
      </form>

      <div id={listboxId}>
        <SearchDropdown
          open={open && reveal}
          query={value}
          results={results}
          trending={trending}
          popularCourses={popularCourses}
          popularMentors={popularMentors}
          recentSearches={recentSearches}
          activeIndex={activeIndex}
          onSelect={navigate}
          onTrendingClick={(q) => {
            setValue(q);
            navigate(buildCatalogSearchUrl(q), q);
          }}
          onActiveIndexChange={setActiveIndex}
          onRemoveRecent={(q) => {
            removeRecentSearch(q);
            setRecentSearches(getRecentSearches());
          }}
          onClearRecent={() => {
            clearRecentSearches();
            setRecentSearches([]);
          }}
        />
      </div>
    </div>
  );
}

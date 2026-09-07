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
import {
  buildCatalogSearchUrl,
  getRecentSearches,
  getTrendingSuggestions,
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
  reveal?: boolean;
  openOnFocus?: boolean;
  initialOpen?: boolean;
  onDismiss?: () => void;
  variant?: "navbar" | "inline";
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
  variant = "navbar",
}: SiteNavSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listboxId = useId();

  const [value, setValue] = useState("");
  const [open, setOpen] = useState(initialOpen);
  const [focused, setFocused] = useState(initialOpen);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trending = useMemo(() => getTrendingSuggestions(), []);
  const { index: catalogIndex } = useCatalogIndex();
  const { results } = useDebouncedSearch(value, catalogIndex, 6);
  const compactCapable = variant === "navbar";
  const expanded = !compactCapable || open || focused;

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
      if (target instanceof Element && target.closest("[data-search-dropdown]")) {
        return;
      }
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
        setFocused(false);
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
    const q = value.trim();
    if (q) {
      if (results.length > 0) {
        const hrefs = results.map((r) => r.href);
        if (results.length >= 4) {
          hrefs.push(buildCatalogSearchUrl(q));
        }
        return hrefs;
      }
      return [buildCatalogSearchUrl(q)];
    }
    return recentSearches.slice(0, 4).map((term) => buildCatalogSearchUrl(term));
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
      setFocused(false);
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
      data-search-expanded={expanded ? "true" : "false"}
      className={cn(
        "relative mx-auto ease-out",
        compactCapable
          ? cn(
              "transition-[width] duration-300",
              expanded ? "w-[min(100vw-12rem,28rem)] sm:w-[min(100vw-16rem,28rem)]" : "w-[9.5rem]"
            )
          : "w-full max-w-none",
        open && reveal && "z-[210]",
        className
      )}
      aria-hidden={!reveal}
    >
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex w-full items-center rounded-full border border-border bg-white/[0.03] text-sm text-muted-foreground transition-[gap,padding,border-color,background-color,box-shadow] duration-300 ease-out focus-within:border-accent/20 focus-within:bg-white/[0.05] focus-within:text-foreground focus-within:shadow-[0_0_0_3px_var(--glow)]",
          compactCapable
            ? cn(
                "overflow-hidden py-1.5",
                expanded ? "cursor-text gap-2 px-3" : "cursor-pointer gap-1.5 px-2.5"
              )
            : "gap-2 px-3 py-1.5",
          (open || focused) &&
            reveal &&
            "border-accent/25 bg-white/[0.05] shadow-[0_0_0_3px_var(--glow)]",
          !reveal && "pointer-events-none opacity-0"
        )}
        role="search"
        onMouseDown={(event) => {
          if (!compactCapable || expanded || !reveal) return;
          if (event.target instanceof HTMLInputElement) return;
          event.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <Search
          className={cn(
            "size-4 shrink-0 transition-transform duration-300",
            compactCapable && !expanded && "opacity-80"
          )}
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (reveal) setOpen(true);
          }}
          onFocus={() => {
            if (!reveal) return;
            setFocused(true);
            if (openOnFocus) setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => {
              if (!containerRef.current?.contains(document.activeElement)) {
                setFocused(false);
              }
            }, 120);
          }}
          onClick={() => {
            if (!reveal) return;
            setFocused(true);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={compactCapable && !expanded ? "Cari..." : placeholder}
          title={placeholder}
          aria-label={placeholder}
          aria-expanded={open && reveal}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          tabIndex={reveal ? 0 : -1}
          className={cn(
            "min-w-0 flex-1 truncate bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground transition-[opacity,width] duration-300 ease-out sm:text-sm",
            compactCapable && !expanded && "placeholder:text-muted-foreground/90",
            inputClassName
          )}
        />
      </form>

      <SearchDropdown
        open={open && reveal}
        query={value}
        results={results}
        trending={trending}
        recentSearches={recentSearches}
        activeIndex={activeIndex}
        onSelect={navigate}
        onTrendingClick={(q) => {
          setValue(q);
          navigate(buildCatalogSearchUrl(q), q);
        }}
        onActiveIndexChange={setActiveIndex}
        anchorRef={containerRef}
      />
    </div>
  );
}

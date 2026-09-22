"use client";

import { useMemo, useState } from "react";

import { IDX_TICKERS } from "@/lib/note/idx-tickers";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  required?: boolean;
}

/**
 * Symbol input with IDX auto-complete.
 * Type "BBCA" → suggests "BBCA.JK (Bank Central Asia)".
 */
export function SymbolInput({ value, onChange, placeholder, ariaLabel, className, required }: Props) {
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const q = value.toUpperCase().trim();
    if (!q || q.length < 1) return [];
    if (q.includes(".") || q.includes(":")) return [];
    // Match IDX tickers that start with the query
    return IDX_TICKERS.filter((t) => t.symbol.startsWith(q)).slice(0, 5);
  }, [value]);

  return (
    <div className="relative">
      <input
        type="text"
        className={className}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      {focused && suggestions.length > 0 ? (
        <ul className="absolute z-30 mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 shadow-lg">
          {suggestions.map((s) => (
            <li key={s.symbol}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                onClick={() => {
                  onChange(`${s.symbol}.JK`);
                  setFocused(false);
                }}
              >
                <span className="font-medium">{s.symbol}.JK</span>
                <span className="text-xs text-zinc-400">{s.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

"use client";

import { highlightMatch } from "@/lib/search/engine";

export function SearchHighlight({ text, query }: { text: string; query: string }) {
  const parts = highlightMatch(text, query);

  return (
    <span>
      {parts.map((part, i) => {
        if (part.match) {
          return (
            <mark
              key={i}
              className="rounded-sm bg-accent/25 px-0.5 font-medium text-foreground"
            >
              {part.match}
            </mark>
          );
        }
        return <span key={i}>{part.before}</span>;
      })}
    </span>
  );
}

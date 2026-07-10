"use client";

import { Search, X } from "lucide-react";

import { authInputClassName } from "@/components/auth-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/chat/types";
import { UserMention } from "@/components/chat/user-mention";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ChannelSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  results: ChatMessage[];
  onSelect: (messageId: string) => void;
  onClose: () => void;
  className?: string;
}

export function ChannelSearch({
  query,
  onQueryChange,
  results,
  onSelect,
  onClose,
  className,
}: ChannelSearchProps) {
  return (
    <div className={cn("border-b border-border/60 bg-muted/20 px-4 py-2", className)}>
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Cari pesan di ruang ini..."
            autoFocus
            className={cn(authInputClassName, "py-2 pl-9 text-sm")}
          />
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {query.trim() && (
        <div className="mt-2 max-h-48 overflow-y-auto">
          {results.length === 0 ? (
            <p className="py-3 text-center text-xs text-muted-foreground">
              Tidak ada pesan ditemukan untuk &ldquo;{query}&rdquo;
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {results.map((msg) => (
                <li key={msg.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(msg.id)}
                    className="w-full rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium">{msg.author.name}</span>
                      <time className="shrink-0 text-[10px] text-muted-foreground">
                        {formatTime(msg.createdAt)}
                      </time>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      <UserMention text={msg.content} />
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

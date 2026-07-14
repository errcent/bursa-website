"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Pin, X } from "lucide-react";

import { UserMention } from "@/components/chat/user-mention";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/chat/types";

function formatPinnedTime(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface PinnedMessagesProps {
  messages: ChatMessage[];
  onJumpTo?: (messageId: string) => void;
  className?: string;
}

export function PinnedMessages({ messages, onJumpTo, className }: PinnedMessagesProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  if (messages.length === 0 || dismissed) return null;

  const active = messages[activeIndex] ?? messages[0];

  return (
    <div
      className={cn(
        "border-b border-border/60 bg-accent/5 px-3 py-2 sm:px-4",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Pin className="mt-0.5 size-4 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium text-accent">
              Pesan Disematkan
              {messages.length > 1 && (
                <span className="ml-1 text-muted-foreground">
                  ({activeIndex + 1}/{messages.length})
                </span>
              )}
            </p>
            <div className="flex shrink-0 items-center gap-0.5">
              {messages.length > 1 && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() =>
                      setActiveIndex((i) => (i - 1 + messages.length) % messages.length)
                    }
                    aria-label="Pin sebelumnya"
                  >
                    <ChevronUp className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setActiveIndex((i) => (i + 1) % messages.length)}
                    aria-label="Pin berikutnya"
                  >
                    <ChevronDown className="size-3" />
                  </Button>
                </>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setDismissed(true)}
                aria-label="Tutup panel pin"
              >
                <X className="size-3" />
              </Button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onJumpTo?.(active.id)}
            className="mt-1 w-full text-left transition-opacity hover:opacity-80"
          >
            <p className="line-clamp-2 text-sm">
              <UserMention text={active.content} />
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {active.author.name} · {formatPinnedTime(active.createdAt)}
            </p>
          </button>
        </div>
      </div>

      {expanded && messages.length > 1 && (
        <ul className="mt-2 flex flex-col gap-2 border-t border-border/40 pt-2 pl-6">
          {messages.map((msg, i) => (
            <li key={msg.id}>
              <button
                type="button"
                onClick={() => {
                  setActiveIndex(i);
                  onJumpTo?.(msg.id);
                }}
                className={cn(
                  "w-full rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/50",
                  i === activeIndex && "bg-muted/30"
                )}
              >
                <UserMention text={msg.content} />
                <p className="text-[10px] text-muted-foreground">
                  {msg.author.name} · {formatPinnedTime(msg.createdAt)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {messages.length > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="mt-1 ml-6"
          onClick={() => setExpanded((v) => !v)}
        >
          <ExternalLink className="mr-1 size-3" />
          {expanded ? "Sembunyikan daftar" : `Lihat semua ${messages.length} pin`}
        </Button>
      )}
    </div>
  );
}

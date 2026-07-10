"use client";

import { cn } from "@/lib/utils";
import type { TypingUser } from "@/lib/chat/types";

interface TypingIndicatorProps {
  users: TypingUser[];
  className?: string;
}

function formatTypingText(users: TypingUser[]): string {
  if (users.length === 0) return "";
  if (users.length === 1) return `${users[0].name} sedang mengetik...`;
  if (users.length === 2) {
    return `${users[0].name} dan ${users[1].name} sedang mengetik...`;
  }
  return `${users[0].name} dan ${users.length - 1} lainnya sedang mengetik...`;
}

export function TypingIndicator({ users, className }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground",
        className
      )}
      aria-live="polite"
    >
      <span className="flex gap-0.5">
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
      </span>
      <span>{formatTypingText(users)}</span>
    </div>
  );
}

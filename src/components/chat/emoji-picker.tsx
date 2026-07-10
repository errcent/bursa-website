"use client";

import { useState } from "react";
import { Smile } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EMOJI_CATEGORIES } from "@/lib/chat/emoji-data";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  triggerClassName?: string;
  disabled?: boolean;
}

export function EmojiPicker({ onSelect, triggerClassName, disabled }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(
    Object.keys(EMOJI_CATEGORIES)[0]
  );

  const emojis =
    EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES] ?? [];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            title="Emoji"
            className={cn("size-10 shrink-0", triggerClassName)}
          />
        }
      >
        <Smile className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-2" align="start">
        <div className="mb-2 flex gap-1 overflow-x-auto">
          {Object.keys(EMOJI_CATEGORIES).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "shrink-0 rounded-md px-2 py-1 text-[10px] transition-colors",
                activeCategory === cat
                  ? "bg-accent/20 text-accent"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-8 gap-0.5">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="flex size-8 items-center justify-center rounded-md text-lg transition-colors hover:bg-muted"
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

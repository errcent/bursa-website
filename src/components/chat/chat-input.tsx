"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Clock,
  Paperclip,
  Send,
  TrendingUp,
  X,
} from "lucide-react";

import { authInputClassName } from "@/components/auth-field";
import { EmojiPicker } from "@/components/chat/emoji-picker";
import { PendingAttachmentsBar } from "@/components/chat/attachment-preview";
import { ChatUserAvatar } from "@/components/chat/chat-user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TICKER_SUGGESTIONS } from "@/lib/chat/mock-chat-data";
import {
  filterMembersForMention,
  findMentionQuery,
  insertMention,
} from "@/lib/chat/mention-utils";
import type { ChatMember, PendingAttachment } from "@/lib/chat/types";

const MAX_CHARS = 2000;
/** Match textarea min-height so action buttons align with the input row */
const INPUT_ROW_CONTROL = "size-10 shrink-0";

type SuggestionMode = "ticker" | "mention" | null;

interface ChatInputProps {
  onSend: (content: string, attachments?: PendingAttachment[]) => void;
  onSignalCompose?: () => void;
  onPollCompose?: () => void;
  onTyping?: () => void;
  isMentor?: boolean;
  members?: ChatMember[];
  replyTo?: { authorName: string; preview: string } | null;
  onCancelReply?: () => void;
  /** Bump to force focus when a reply is started */
  replyFocusKey?: number;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  /** Shown when readOnly — defaults to announcement copy if omitted. */
  readOnlyMessage?: string;
  slowModeSeconds?: number;
  lastSentAt?: number;
  className?: string;
}

function detectAttachmentType(file: File): PendingAttachment["type"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf") return "pdf";
  return "file";
}

export function ChatInput({
  onSend,
  onSignalCompose,
  onPollCompose,
  onTyping,
  isMentor,
  members = [],
  replyTo,
  onCancelReply,
  replyFocusKey = 0,
  placeholder = "Ketik pesan... gunakan $TICKER atau @username",
  disabled,
  readOnly,
  readOnlyMessage,
  slowModeSeconds,
  lastSentAt,
  className,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [suggestionMode, setSuggestionMode] = useState<SuggestionMode>(null);
  const [tickerSuggestions, setTickerSuggestions] = useState<string[]>([]);
  const [mentionSuggestions, setMentionSuggestions] = useState<ChatMember[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [slowTick, setSlowTick] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const slowModeRemaining =
    slowModeSeconds && lastSentAt
      ? Math.max(0, slowModeSeconds - Math.floor((Date.now() - lastSentAt) / 1000))
      : 0;

  const isSlowModeBlocked = slowModeRemaining > 0;
  const isDisabled = disabled || readOnly || isSlowModeBlocked;

  useEffect(() => {
    if (!isSlowModeBlocked) return;
    const id = window.setInterval(() => setSlowTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [isSlowModeBlocked, lastSentAt]);

  void slowTick;

  useEffect(() => {
    if (!replyTo && replyFocusKey === 0) return;
    const el = textareaRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    });
  }, [replyTo, replyFocusKey]);

  const updateSuggestions = useCallback(
    (text: string, cursor: number) => {
      const mentionQuery = findMentionQuery(text, cursor);
      if (mentionQuery !== null) {
        setSuggestionMode("mention");
        setMentionSuggestions(filterMembersForMention(members, mentionQuery));
        setTickerSuggestions([]);
        setSuggestionIndex(0);
        return;
      }

      const before = text.slice(0, cursor);
      const tickerMatch = before.match(/\$([A-Z]*)$/i);
      if (tickerMatch) {
        const query = tickerMatch[1].toUpperCase();
        const filtered = TICKER_SUGGESTIONS.filter((t) => t.startsWith(query)).slice(0, 6);
        setSuggestionMode("ticker");
        setTickerSuggestions(filtered);
        setMentionSuggestions([]);
        setSuggestionIndex(0);
        return;
      }

      setSuggestionMode(null);
      setTickerSuggestions([]);
      setMentionSuggestions([]);
    },
    [members]
  );

  const insertTicker = (ticker: string) => {
    const el = textareaRef.current;
    if (!el) return;

    const cursor = el.selectionStart;
    const before = value.slice(0, cursor);
    const after = value.slice(cursor);
    const replaced = before.replace(/\$[A-Z]*$/i, `$${ticker} `);
    const next = replaced + after;
    setValue(next);
    setSuggestionMode(null);
    requestAnimationFrame(() => {
      el.focus();
      const pos = replaced.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const selectMention = (member: ChatMember) => {
    const el = textareaRef.current;
    if (!el) return;

    const cursor = el.selectionStart;
    const { text, cursor: newCursor } = insertMention(value, cursor, member);
    setValue(text);
    setSuggestionMode(null);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newCursor, newCursor);
    });
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if ((!trimmed && pendingAttachments.length === 0) || isDisabled) return;
    onSend(trimmed, pendingAttachments.length > 0 ? pendingAttachments : undefined);
    setValue("");
    setSuggestionMode(null);
    setPendingAttachments((prev) => {
      prev.forEach((a) => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
      return [];
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newAttachments: PendingAttachment[] = files.map((file) => {
      const type = detectAttachmentType(file);
      return {
        id: `pending-${Date.now()}-${file.name}`,
        file,
        type,
        previewUrl: type === "image" ? URL.createObjectURL(file) : undefined,
      };
    });
    setPendingAttachments((prev) => [...prev, ...newAttachments].slice(0, 5));
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setPendingAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att?.previewUrl) URL.revokeObjectURL(att.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setValue((v) => v + emoji);
      return;
    }
    const cursor = el.selectionStart;
    const next = value.slice(0, cursor) + emoji + value.slice(cursor);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = cursor + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestionMode === "ticker" && tickerSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestionIndex((i) => (i + 1) % tickerSuggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestionIndex((i) => (i - 1 + tickerSuggestions.length) % tickerSuggestions.length);
        return;
      }
      if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
        e.preventDefault();
        insertTicker(tickerSuggestions[suggestionIndex]);
        return;
      }
    }

    if (suggestionMode === "mention" && mentionSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestionIndex((i) => (i + 1) % mentionSuggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestionIndex((i) => (i - 1 + mentionSuggestions.length) % mentionSuggestions.length);
        return;
      }
      if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
        e.preventDefault();
        selectMention(mentionSuggestions[suggestionIndex]);
        return;
      }
    }

    if (e.key === "Escape") {
      setSuggestionMode(null);
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charCount = value.length;
  const nearLimit = charCount > MAX_CHARS * 0.9;

  if (readOnly) {
    return (
      <div className={cn("border-t border-border/60 bg-muted/20 px-4 py-3 text-center text-sm text-muted-foreground", className)}>
        {readOnlyMessage ??
          "Cabang ini hanya baca — hanya mentor yang dapat mengirim pesan."}
      </div>
    );
  }

  return (
    <div className={cn("border-t border-border/60 bg-background/80 p-3 backdrop-blur-sm", className)}>
      {slowModeSeconds && slowModeSeconds > 0 && (
        <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="size-3" />
          {isSlowModeBlocked ? (
            <span>Mode lambat aktif — tunggu {slowModeRemaining} detik</span>
          ) : (
            <span>Mode lambat: {slowModeSeconds} detik antar pesan</span>
          )}
        </div>
      )}

      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-lg border-l-4 border-accent bg-muted/30 px-3 py-2 text-xs">
          <div className="min-w-0">
            <span className="text-muted-foreground">Membalas </span>
            <span className="font-medium text-accent">{replyTo.authorName}</span>
            <p className="truncate text-muted-foreground">{replyTo.preview}</p>
          </div>
          <Button type="button" variant="ghost" size="icon-xs" onClick={onCancelReply}>
            <X className="size-3" />
          </Button>
        </div>
      )}

      <PendingAttachmentsBar attachments={pendingAttachments} onRemove={removeAttachment} />

      {suggestionMode === "ticker" && tickerSuggestions.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1 rounded-lg border border-border/60 bg-popover p-2">
          {tickerSuggestions.map((ticker, i) => (
            <li key={ticker}>
              <button
                type="button"
                onClick={() => insertTicker(ticker)}
                className={cn(
                  "rounded-md px-2 py-1 font-mono text-xs transition-colors",
                  i === suggestionIndex ? "bg-accent/20 text-accent" : "hover:bg-muted"
                )}
              >
                ${ticker}
              </button>
            </li>
          ))}
        </ul>
      )}

      {suggestionMode === "mention" && mentionSuggestions.length > 0 && (
        <ul className="mb-2 flex flex-col gap-0.5 rounded-lg border border-border/60 bg-popover p-1">
          {mentionSuggestions.map((member, i) => (
            <li key={member.id}>
              <button
                type="button"
                onClick={() => selectMention(member)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  i === suggestionIndex ? "bg-accent/20" : "hover:bg-muted"
                )}
              >
                <ChatUserAvatar
                  userId={member.id}
                  name={member.name}
                  initials={member.initials}
                  avatarUrl={member.avatarUrl}
                  size="sm"
                />
                <div>
                  <span className="font-medium">@{member.username ?? member.name.split(" ")[0]}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{member.name}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <div className="flex h-10 shrink-0 items-center gap-0.5">
          {isMentor && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={INPUT_ROW_CONTROL}
              onClick={() => onSignalCompose?.()}
              disabled={!onSignalCompose}
              title="Entry posisi / kirim sinyal trading"
              aria-label="Entry posisi"
            >
              <TrendingUp className="size-4" />
            </Button>
          )}
          <EmojiPicker
            onSelect={insertEmoji}
            disabled={isDisabled}
            triggerClassName={INPUT_ROW_CONTROL}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={INPUT_ROW_CONTROL}
            disabled={isDisabled}
            title="Lampirkan file"
            aria-label="Lampirkan file"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="size-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          {isMentor && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={INPUT_ROW_CONTROL}
              disabled={isDisabled || !onPollCompose}
              title="Buat polling"
              aria-label="Buat polling"
              onClick={() => onPollCompose?.()}
            >
              <BarChart3 className="size-4" />
            </Button>
          )}
        </div>

        <div className="relative min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value.slice(0, MAX_CHARS));
              updateSuggestions(e.target.value, e.target.selectionStart);
              onTyping?.();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled}
            rows={1}
            className={cn(
              authInputClassName,
              "min-h-10 max-h-32 resize-none py-2.5 pr-16"
            )}
          />
          <span
            className={cn(
              "absolute right-2 bottom-2.5 font-mono text-[10px]",
              nearLimit ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {charCount}/{MAX_CHARS}
          </span>
        </div>

        <Button
          type="button"
          className={cn("btn-primary", INPUT_ROW_CONTROL)}
          size="icon"
          onClick={handleSend}
          disabled={isDisabled || (!value.trim() && pendingAttachments.length === 0)}
          aria-label="Kirim pesan"
        >
          <Send className="size-4" />
        </Button>
      </div>

      <p className="mt-1.5 text-[10px] text-muted-foreground">
        Enter kirim · Shift+Enter baris baru · $ ticker · @ sebut pengguna
        {isMentor ? " · Tombol chart = entry posisi · Tombol grafik = buat polling" : ""}
      </p>
    </div>
  );
}

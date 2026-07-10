"use client";

import { useState } from "react";
import {
  Check,
  CornerDownRight,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Reply,
  Trash2,
  X,
} from "lucide-react";

import { EmojiPicker } from "@/components/chat/emoji-picker";
import { AttachmentDisplay } from "@/components/chat/attachment-preview";
import { ChatUserAvatar } from "@/components/chat/chat-user-avatar";
import { MessageEmbedCard } from "@/components/chat/message-embed";
import { UserMention } from "@/components/chat/user-mention";
import { TradingSignalCard } from "@/components/chat/trading-signal-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { QUICK_REACTIONS } from "@/lib/chat/emoji-data";
import {
  groupBubbleRadiusClasses,
  type MessageGroupMeta,
} from "@/lib/chat/message-grouping";
import type { ChatMessage } from "@/lib/chat/types";

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)} jam lalu`;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const DEFAULT_GROUP: MessageGroupMeta = {
  position: "standalone",
  showAvatar: true,
  showName: true,
  showTime: true,
  isGroupedWithPrev: false,
  isGroupedWithNext: false,
};

interface MessageBubbleProps {
  message: ChatMessage;
  /** Preferred viewer id (Prisma cuid) once known from the messages API. */
  currentUserId?: string;
  /**
   * Every id that identifies the signed-in user. Client auth often uses
   * `user-demo-*` while message authors use Prisma cuids — pass both so
   * optimistic and server messages resolve as own.
   */
  ownUserIds?: readonly string[];
  isMentor?: boolean;
  isReplyTarget?: boolean;
  /** Consecutive-message grouping (WhatsApp / Instagram style). */
  group?: MessageGroupMeta;
  onReply?: (message: ChatMessage) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onPollVote?: (messageId: string, optionId: string) => void;
  className?: string;
}

function resolveIsOwnMessage(input: {
  authorId: string;
  currentUserId?: string;
  ownUserIds?: readonly string[];
}): boolean {
  const ids = new Set<string>();
  for (const id of input.ownUserIds ?? []) {
    if (id && id !== "guest") ids.add(id);
  }
  if (input.currentUserId && input.currentUserId !== "guest") {
    ids.add(input.currentUserId);
  }
  // Primary: Prisma cuid and/or client session id (user-demo-*).
  return ids.size > 0 && ids.has(input.authorId);
}

export function MessageBubble({
  message,
  currentUserId,
  ownUserIds,
  isMentor,
  isReplyTarget,
  group = DEFAULT_GROUP,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onPollVote,
  className,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const author = message.author ?? {
    id: "unknown",
    name: "Pengguna",
    initials: "?",
    role: "member" as const,
    isOnline: false,
  };
  const isAnnouncement = message.type === "announcement";
  const isSystem = message.type === "system";
  const showMentorBadge = isMentor || author.role === "mentor";
  const showModBadge = author.role === "moderator";
  const isOwn = resolveIsOwnMessage({
    authorId: author.id,
    currentUserId,
    ownUserIds,
  });
  const canEdit = isOwn && message.type === "text" && !message.isDeleted;
  const canDelete = isOwn && !message.isDeleted && !isSystem;

  const handleSaveEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== message.content) {
      onEdit?.(message.id, trimmed);
    }
    setIsEditing(false);
  };

  if (message.isDeleted) {
    return (
      <article className={cn("px-2 py-2 sm:px-3", className)}>
        <p className="text-xs italic text-muted-foreground">Pesan ini telah dihapus.</p>
      </article>
    );
  }

  if (isSystem) {
    return (
      <article
        id={`msg-${message.id}`}
        className={cn("flex justify-center px-2 py-2 sm:px-3", className)}
        role="status"
      >
        <p className="max-w-[90%] text-center text-xs text-muted-foreground">
          {message.content}
        </p>
      </article>
    );
  }

  const showMeta =
    group.showName ||
    group.showTime ||
    Boolean(message.editedAt) ||
    isAnnouncement;

  const metaRow = showMeta ? (
    <div
      className={cn(
        "mb-1 flex flex-wrap items-center gap-2",
        isOwn && "justify-end"
      )}
    >
      {group.showName && !isOwn && (
        <span className="font-heading text-sm font-medium">{author.name}</span>
      )}
      {group.showName && showMentorBadge && (
        <Badge variant="accent" className="h-4 gap-0.5 px-1.5 text-[10px]">
          Mentor
        </Badge>
      )}
      {group.showName && showModBadge && (
        <Badge
          variant="outline"
          className="h-4 gap-0.5 border-emerald/30 bg-emerald/10 px-1.5 text-[10px] text-emerald"
        >
          Moderator
        </Badge>
      )}
      {isAnnouncement && (
        <Badge variant="outline" className="h-4 gap-0.5 px-1.5 text-[10px]">
          <Megaphone className="size-2.5" />
          Pengumuman
        </Badge>
      )}
      {group.showTime && (
        <time className="text-[11px] text-muted-foreground">
          {formatTime(message.createdAt)}
        </time>
      )}
      {message.editedAt && (
        <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
          <Pencil className="size-2.5" />
          diedit
        </span>
      )}
      {group.showName && isOwn && (
        <span className="font-heading text-sm font-medium">{author.name}</span>
      )}
    </div>
  ) : null;

  const replyPreview = message.replyTo ? (
    <button
      type="button"
      onClick={() => {
        const el = document.getElementById(`msg-${message.replyTo!.id}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }}
      className={cn(
        "mb-2 flex w-full items-start gap-1.5 rounded-lg border-l-4 border-accent/50 px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors",
        isOwn
          ? "bg-background/40 hover:bg-background/60"
          : "bg-muted/40 hover:bg-muted/60"
      )}
    >
      <CornerDownRight className="mt-0.5 size-3 shrink-0 text-accent" />
      <div className="min-w-0">
        <span className="font-medium text-accent">{message.replyTo.authorName}</span>
        <p className="truncate">{message.replyTo.preview}</p>
      </div>
    </button>
  ) : null;

  const bubbleBody = isEditing ? (
    <div className="flex flex-col gap-2">
      <textarea
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
        rows={3}
        autoFocus
      />
      <div className="flex gap-1">
        <Button type="button" size="xs" onClick={handleSaveEdit}>
          <Check className="mr-1 size-3" />
          Simpan
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => {
            setEditValue(message.content);
            setIsEditing(false);
          }}
        >
          <X className="mr-1 size-3" />
          Batal
        </Button>
      </div>
    </div>
  ) : message.type === "signal" && message.signal ? (
    <div className="flex flex-col gap-2">
      {message.content && (
        <p className="text-sm">
          <UserMention text={message.content} />
        </p>
      )}
      <TradingSignalCard signal={message.signal} />
    </div>
  ) : message.type === "poll" && message.poll ? (
    <div className="flex w-full min-w-0 flex-col gap-2">
      {message.content && message.content !== message.poll.question && (
        <p className="text-sm">
          <UserMention text={message.content} />
        </p>
      )}
      <div
        className={cn(
          "w-full min-w-[min(100%,16rem)] max-w-full rounded-xl border p-3 sm:p-4",
          isOwn
            ? "border-primary/25 bg-background/35"
            : "border-border/50 bg-background/40"
        )}
      >
        <p className="mb-3 font-heading text-sm font-medium">{message.poll.question}</p>
        <ul className="flex flex-col gap-2">
          {message.poll.options.map((opt) => {
            const total = Math.max(0, Number(message.poll!.totalVotes) || 0);
            const votes = Math.max(0, Number(opt.votes) || 0);
            const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
            const hasVoted = Boolean(message.poll!.votedOptionId);
            const isSelected = message.poll!.votedOptionId === opt.id;
            const isExpired =
              message.poll!.endsAt != null &&
              !Number.isNaN(new Date(message.poll!.endsAt).getTime()) &&
              new Date(message.poll!.endsAt).getTime() < Date.now();
            const canVote = !hasVoted && !isExpired && Boolean(onPollVote);

            return (
              <li key={opt.id}>
                <button
                  type="button"
                  disabled={!canVote}
                  onClick={() => onPollVote?.(message.id, opt.id)}
                  className={cn(
                    "relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    isSelected
                      ? "border-accent/50 bg-accent/5"
                      : "border-border/60",
                    canVote && "hover:border-accent/30",
                    !canVote && "cursor-default"
                  )}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-accent/15"
                    style={{ width: `${Number.isFinite(pct) ? pct : 0}%` }}
                  />
                  <span className="relative flex justify-between gap-2">
                    <span className={cn(isSelected && "font-medium text-accent")}>
                      {opt.label}
                    </span>
                    {(hasVoted || isExpired) && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {Number.isFinite(pct) ? pct : 0}%
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {Math.max(0, Number(message.poll.totalVotes) || 0)} suara
          {message.poll.votedOptionId ? " · Suara kamu tercatat" : ""}
          {message.poll.endsAt &&
          !Number.isNaN(new Date(message.poll.endsAt).getTime())
            ? new Date(message.poll.endsAt).getTime() < Date.now()
              ? " · Polling berakhir"
              : ` · Berakhir ${new Date(message.poll.endsAt).toLocaleString("id-ID", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
            : ""}
        </p>
      </div>
    </div>
  ) : (
    <p className={cn("text-sm leading-relaxed", isAnnouncement && "font-medium")}>
      <UserMention text={message.content} />
    </p>
  );

  const attachmentsAndEmbeds = (
    <>
      {message.attachments?.map((att) => (
        <AttachmentDisplay key={att.id} attachment={att} />
      ))}
      {message.embeds?.map((embed) => (
        <MessageEmbedCard key={embed.url} embed={embed} />
      ))}
    </>
  );

  const reactionsRow =
    (message.reactions?.length ?? 0) > 0 ? (
      <div className={cn("mt-1.5 flex flex-wrap gap-1", isOwn && "justify-end")}>
        {message.reactions!.map((r) => (
          <button
            key={r.emoji}
            type="button"
            onClick={() => onReact?.(message.id, r.emoji)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
              r.userReacted
                ? "border-accent/40 bg-accent/15"
                : "border-border/60 bg-muted/30 hover:bg-muted/50"
            )}
          >
            <span>{r.emoji}</span>
            <span className="font-mono">{r.count}</span>
          </button>
        ))}
      </div>
    ) : null;

  const actionRow = (
    <div
      className={cn(
        "mt-0.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100",
        isOwn && "justify-end"
      )}
    >
      {QUICK_REACTIONS.slice(0, 5).map((emoji) => (
        <Button
          key={emoji}
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-xs"
          onClick={() => onReact?.(message.id, emoji)}
          aria-label={`Reaksi ${emoji}`}
        >
          {emoji}
        </Button>
      ))}
      <EmojiPicker
        onSelect={(emoji) => onReact?.(message.id, emoji)}
        triggerClassName="size-6"
      />
      {onReply && (
        <Button type="button" variant="ghost" size="xs" onClick={() => onReply(message)}>
          <Reply className="mr-1 size-3" />
          Balas
        </Button>
      )}
      {(canEdit || canDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button type="button" variant="ghost" size="icon-xs">
                <MoreHorizontal className="size-3" />
              </Button>
            }
          />
          <DropdownMenuContent align={isOwn ? "end" : "start"}>
            {canEdit && (
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="size-3" />
                Edit pesan
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete?.(message.id)}
              >
                <Trash2 className="size-3" />
                Hapus pesan
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );

  // Others: avatar on last/standalone (WhatsApp). Own: no avatar column.
  const avatarSlot = !isOwn ? (
    <div className="mt-0.5 flex w-8 shrink-0 justify-center sm:w-9">
      {group.showAvatar ? (
        <ChatUserAvatar
          userId={author.id}
          name={author.name}
          initials={author.initials}
          avatarUrl={author.avatarUrl}
          size="sm"
        />
      ) : (
        <span className="size-8" aria-hidden />
      )}
    </div>
  ) : null;

  return (
    <article
      id={`msg-${message.id}`}
      className={cn(
        "group relative flex w-full gap-2.5 px-2 sm:gap-3 sm:px-3",
        group.isGroupedWithPrev ? "pt-0.5" : "pt-2",
        group.isGroupedWithNext ? "pb-0.5" : "pb-2",
        isOwn ? "flex-row-reverse justify-start" : "flex-row justify-start",
        isReplyTarget && "rounded-xl bg-accent/5",
        className
      )}
    >
      {avatarSlot}

      <div
        className={cn(
          "min-w-0 max-w-[min(100%,32rem)]",
          isOwn ? "flex flex-col items-end" : "flex flex-col items-start",
          (message.type === "poll" || message.type === "signal") &&
            "w-full sm:w-[min(100%,32rem)]"
        )}
      >
        {metaRow}

        <div
          className={cn(
            "w-fit max-w-full px-3.5 py-2.5 shadow-sm",
            groupBubbleRadiusClasses(group.position, isOwn),
            (message.type === "poll" || message.type === "signal") && "w-full",
            isOwn
              ? "bg-primary/20 text-foreground ring-1 ring-primary/25"
              : "bg-muted/70 text-foreground ring-1 ring-border/50",
            isAnnouncement && !isOwn && "bg-accent/10 ring-accent/25",
            isAnnouncement && isOwn && "ring-accent/30"
          )}
        >
          {replyPreview}
          {bubbleBody}
          {attachmentsAndEmbeds}
        </div>

        {reactionsRow}
        {actionRow}
      </div>
    </article>
  );
}

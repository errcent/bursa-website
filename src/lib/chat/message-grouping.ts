import type { ChatMessage } from "@/lib/chat/types";

/** Max gap between consecutive same-author messages to stay in one visual group. */
export const MESSAGE_GROUP_GAP_MS = 2 * 60 * 1000;

export type MessageGroupPosition = "standalone" | "first" | "middle" | "last";

export interface MessageGroupMeta {
  position: MessageGroupPosition;
  /** Avatar for others (and optional own) — WhatsApp: last in streak. */
  showAvatar: boolean;
  /** Author name / role badges — first in streak. */
  showName: boolean;
  /** Timestamp — last in streak (gap already ended the group). */
  showTime: boolean;
  /** Tighter vertical padding when glued to neighbors in the streak. */
  isGroupedWithPrev: boolean;
  isGroupedWithNext: boolean;
}

function isGroupableMessage(message: ChatMessage): boolean {
  if (message.isDeleted) return false;
  if (message.type === "system") return false;
  return Boolean(message.author?.id);
}

function sameAuthor(a: ChatMessage, b: ChatMessage): boolean {
  const aId = a.author?.id;
  const bId = b.author?.id;
  return Boolean(aId && bId && aId === bId);
}

function withinGroupGap(earlier: ChatMessage, later: ChatMessage): boolean {
  const t0 = new Date(earlier.createdAt).getTime();
  const t1 = new Date(later.createdAt).getTime();
  if (!Number.isFinite(t0) || !Number.isFinite(t1)) return false;
  return Math.abs(t1 - t0) <= MESSAGE_GROUP_GAP_MS;
}

/** Whether `current` continues a streak from `previous` (previous is older / above). */
export function isGroupedWithPrevious(
  previous: ChatMessage | undefined,
  current: ChatMessage
): boolean {
  if (!previous || !isGroupableMessage(previous) || !isGroupableMessage(current)) {
    return false;
  }
  return sameAuthor(previous, current) && withinGroupGap(previous, current);
}

/** Whether `current` continues into `next` (next is newer / below). */
export function isGroupedWithNext(
  current: ChatMessage,
  next: ChatMessage | undefined
): boolean {
  if (!next || !isGroupableMessage(current) || !isGroupableMessage(next)) {
    return false;
  }
  return sameAuthor(current, next) && withinGroupGap(current, next);
}

export function getMessageGroupMeta(
  previous: ChatMessage | undefined,
  current: ChatMessage,
  next: ChatMessage | undefined
): MessageGroupMeta {
  if (!isGroupableMessage(current)) {
    return {
      position: "standalone",
      showAvatar: true,
      showName: true,
      showTime: true,
      isGroupedWithPrev: false,
      isGroupedWithNext: false,
    };
  }

  const withPrev = isGroupedWithPrevious(previous, current);
  const withNext = isGroupedWithNext(current, next);
  /** Replies always show the author header so the avatar sits beside the name, not the quote. */
  const isReply = Boolean(current.replyTo);

  let position: MessageGroupPosition;
  if (!withPrev && !withNext) position = "standalone";
  else if (!withPrev && withNext) position = "first";
  else if (withPrev && withNext) position = "middle";
  else position = "last";

  const isStart = position === "standalone" || position === "first";
  const isEnd = position === "standalone" || position === "last";

  return {
    position,
    showAvatar: isEnd || isReply,
    showName: isStart || isReply,
    showTime: isEnd,
    isGroupedWithPrev: withPrev,
    isGroupedWithNext: withNext,
  };
}

/**
 * Corner radii for WhatsApp/Instagram-style stacked bubbles.
 * Outer corners stay fully rounded; the connecting side is flatter.
 */
export function groupBubbleRadiusClasses(
  position: MessageGroupPosition,
  isOwn: boolean
): string {
  // Base: 1rem (rounded-2xl). Connecting / tail corners: 0.375rem (rounded-md).
  if (isOwn) {
    switch (position) {
      case "first":
        return "rounded-2xl rounded-br-md";
      case "middle":
        return "rounded-2xl rounded-tr-md rounded-br-md";
      case "last":
        return "rounded-2xl rounded-tr-md";
      case "standalone":
      default:
        return "rounded-2xl rounded-br-md";
    }
  }

  switch (position) {
    case "first":
      return "rounded-2xl rounded-bl-md";
    case "middle":
      return "rounded-2xl rounded-tl-md rounded-bl-md";
    case "last":
      return "rounded-2xl rounded-tl-md";
    case "standalone":
    default:
      return "rounded-2xl rounded-bl-md";
  }
}

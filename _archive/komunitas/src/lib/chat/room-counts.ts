import type { ChatRoom } from "@/lib/chat/types";

/** Coerce partial/API room payloads so UI never sums or renders NaN counts. */
export function safeRoomCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeChatRoomCounts<T extends Partial<ChatRoom>>(
  room: T
): T & {
  unreadCount: number;
  onlineCount: number;
  mentionUnreadCount: number;
  hasMention: boolean;
} {
  const mentionUnreadCount = safeRoomCount(room.mentionUnreadCount);
  const hasMention =
    room.hasMention === true || mentionUnreadCount > 0;
  return {
    ...room,
    unreadCount: safeRoomCount(room.unreadCount),
    onlineCount: safeRoomCount(room.onlineCount),
    mentionUnreadCount,
    hasMention,
    branches: room.branches?.map((b) => {
      const branchMention = safeRoomCount(b.mentionUnreadCount);
      return {
        ...b,
        unreadCount: safeRoomCount(b.unreadCount),
        mentionUnreadCount: branchMention,
        hasMention: b.hasMention === true || branchMention > 0,
      };
    }),
  };
}

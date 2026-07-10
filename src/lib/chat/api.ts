import { getSession } from "@/lib/auth/client";
import { normalizeChatRoomCounts } from "@/lib/chat/room-counts";
import type { ChatMember, ChatRoom, MemberRole } from "@/lib/chat/types";

function authHeaders(): HeadersInit {
  const session = getSession();
  if (!session) return {};
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-user-email": session.email,
    "x-user-id": session.userId,
  };
  if (session.name) headers["x-user-name"] = session.name;
  if (session.role) headers["x-user-role"] = session.role;
  return headers;
}

function isMemberRole(value: unknown): value is MemberRole {
  return value === "mentor" || value === "moderator" || value === "member";
}

function mapApiMember(raw: Record<string, unknown>): ChatMember | null {
  if (typeof raw.id !== "string" || typeof raw.name !== "string") return null;
  const role = isMemberRole(raw.role) ? raw.role : "member";
  const name = raw.name;
  return {
    id: raw.id,
    name,
    initials:
      typeof raw.initials === "string" && raw.initials.trim()
        ? raw.initials
        : name.slice(0, 2).toUpperCase(),
    role,
    isOnline: Boolean(raw.isOnline),
    avatarUrl: typeof raw.avatarUrl === "string" ? raw.avatarUrl : undefined,
    username: typeof raw.username === "string" ? raw.username : undefined,
    profileSlug: typeof raw.profileSlug === "string" ? raw.profileSlug : undefined,
    bio: typeof raw.bio === "string" ? raw.bio : undefined,
  };
}

export async function fetchViewerChatRooms(): Promise<ChatRoom[]> {
  const res = await fetch("/api/chat/rooms", {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Gagal memuat daftar ruang chat");
  }
  const data = (await res.json()) as { rooms?: ChatRoom[] };
  return (data.rooms ?? []).map((room) => normalizeChatRoomCounts(room));
}

/** Live ChatRoomMember rows for a room (mentor, moderator, member). */
export async function fetchRoomMembers(roomId: string): Promise<ChatMember[] | null> {
  try {
    const res = await fetch(`/api/chat/rooms/${roomId}/members`, {
      headers: authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { members?: unknown };
    if (!Array.isArray(data.members)) return [];
    return data.members
      .map((m) =>
        m && typeof m === "object" ? mapApiMember(m as Record<string, unknown>) : null
      )
      .filter((m): m is ChatMember => m !== null);
  } catch {
    return null;
  }
}

export async function joinChatRoom(roomId: string): Promise<void> {
  const res = await fetch(`/api/chat/rooms/${roomId}/join`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const json = JSON.parse(text) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      /* keep text */
    }
    throw new Error(message || "Gagal bergabung ke ruang");
  }
}

/** Advance ChatRoomMember.lastReadAt so list badges clear for this room. */
export async function markChatRoomRead(
  roomId: string
): Promise<{
  lastReadAt: string;
  unreadCount: number;
  mentionUnreadCount: number;
  hasMention: boolean;
} | null> {
  try {
    const res = await fetch(`/api/chat/rooms/${roomId}/read`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      lastReadAt?: string;
      unreadCount?: number;
      mentionUnreadCount?: number;
      hasMention?: boolean;
    };
    if (typeof data.lastReadAt !== "string") return null;
    return {
      lastReadAt: data.lastReadAt,
      unreadCount: typeof data.unreadCount === "number" ? data.unreadCount : 0,
      mentionUnreadCount:
        typeof data.mentionUnreadCount === "number" ? data.mentionUnreadCount : 0,
      hasMention: data.hasMention === true,
    };
  } catch {
    return null;
  }
}

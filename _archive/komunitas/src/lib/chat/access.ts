import type { UserRole } from "@/lib/auth/types";
import type { BranchVisibility, ChatBranchInfo, ChatRoom } from "@/lib/chat/types";

/**
 * Staff collaboration / legacy internal rooms — whole-room privacy.
 * Mentor hubs are no longer "private rooms"; privacy is per-branch.
 */
export function isPrivateMentorRoom(
  room: Pick<ChatRoom, "channelCategory" | "isProtected" | "roomKind">
): boolean {
  if (room.roomKind === "mentor_internal") return true;
  if (room.channelCategory === "Internal") return true;
  // Hub rooms themselves are not private; private cabang are filtered separately.
  if (room.roomKind === "mentor_community") return false;
  return room.isProtected && room.roomKind !== "public";
}

export function isPublicCommunityRoom(
  room: Pick<ChatRoom, "roomKind" | "channelCategory">
): boolean {
  return room.roomKind === "public" || room.channelCategory === "Publik";
}

export function isPrivateBranchInfo(
  branch: Pick<ChatBranchInfo, "visibility"> | null | undefined
): boolean {
  return branch?.visibility === "private";
}

/**
 * Filter branches visible to the current viewer.
 * Developers never see private cabang; learners only see public cabang
 * unless they are mentor/moderator on the room.
 */
export function filterBranchesForViewer(
  branches: ChatBranchInfo[] | undefined,
  opts: {
    role?: UserRole | null;
    memberRole?: "mentor" | "moderator" | "member" | null;
    isRoomOwner?: boolean;
  }
): ChatBranchInfo[] {
  if (!branches?.length) return [];
  const { role, memberRole, isRoomOwner } = opts;
  return branches.filter((b) => {
    if (b.visibility !== "private") return true;
    if (role === "developer") return false;
    if (isRoomOwner) return true;
    return memberRole === "mentor" || memberRole === "moderator";
  });
}

export function canViewRoomContents(
  role: UserRole | undefined | null,
  room: Pick<ChatRoom, "channelCategory" | "isProtected" | "roomKind">
): boolean {
  if (!isPrivateMentorRoom(room)) return true;
  // Developers are blocked from staff/private room contents (privacy).
  if (role === "developer") return false;
  return true;
}

export function canViewBranchContents(
  role: UserRole | undefined | null,
  branch: Pick<ChatBranchInfo, "visibility"> | null | undefined,
  opts?: { memberRole?: "mentor" | "moderator" | "member" | null; isRoomOwner?: boolean }
): boolean {
  if (!branch || branch.visibility !== "private") return true;
  if (role === "developer") return false;
  if (opts?.isRoomOwner) return true;
  const mr = opts?.memberRole;
  return mr === "mentor" || mr === "moderator";
}

/**
 * Client-side room list filter.
 * - Developers: hide staff/private whole-room chats
 * - Mentors: only PUBLIC + hubs they own or moderate (privacy between mentors)
 * - Learners: only PUBLIC + hubs they subscribed to (ChatRoomMember)
 * - Others (admin): all discoverable rooms
 *
 * Pass `mentorProfileId` / `accessibleHubIds` for mentors, or `subscribedHubIds`
 * for learners. Without those ids, mentor hubs are hidden (fail closed).
 */
export function filterRoomsForRole<
  T extends Pick<
    ChatRoom,
    "id" | "channelCategory" | "isProtected" | "roomKind" | "mentorId"
  >,
>(
  rooms: T[],
  role: UserRole | undefined | null,
  opts?: {
    mentorProfileId?: string | null;
    accessibleHubIds?: string[];
    subscribedHubIds?: string[];
  }
): T[] {
  let filtered = rooms;
  if (role === "developer") {
    filtered = filtered.filter((room) => !isPrivateMentorRoom(room));
  }
  if (role === "mentor") {
    const ownId = opts?.mentorProfileId ?? null;
    const accessible = new Set(opts?.accessibleHubIds ?? []);
    filtered = filtered.filter((room) => {
      if (isPublicCommunityRoom(room)) return true;
      if (room.roomKind === "mentor_internal" || room.channelCategory === "Internal") {
        // Per-mentor admin threads: only the owning mentor (or explicit hub access).
        if (ownId && room.mentorId && room.mentorId === ownId) return true;
        return accessible.has(room.id);
      }
      if (ownId && room.mentorId && room.mentorId === ownId) return true;
      return accessible.has(room.id);
    });
  }
  if (role === "learner") {
    const subscribed = new Set(opts?.subscribedHubIds ?? []);
    filtered = filtered.filter((room) => {
      if (isPublicCommunityRoom(room)) return true;
      if (room.roomKind === "mentor_internal" || room.channelCategory === "Internal") {
        return false;
      }
      return subscribed.has(room.id);
    });
  }
  return filtered;
}

export type { BranchVisibility };

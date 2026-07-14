import {
  ChatBranchMode,
  ChatBranchSenderPolicy,
  ChatBranchVisibility,
  ChatMemberRole,
  ChatRoomKind,
  type ChatBranch,
  type ChatRoom,
  type ChatRoomMember,
} from "@prisma/client";

export type RoomKindUi = "public" | "mentor_community" | "mentor_internal";
export type BranchModeUi = "one_way" | "two_way";
export type SenderPolicyUi = "mentor_only" | "mentor_and_moderators";
export type BranchVisibilityUi = "public" | "private";

export function roomKindToUi(kind: ChatRoomKind): RoomKindUi {
  if (kind === ChatRoomKind.PUBLIC) return "public";
  if (kind === ChatRoomKind.MENTOR_INTERNAL) return "mentor_internal";
  return "mentor_community";
}

export function roomKindFromUi(kind: RoomKindUi): ChatRoomKind {
  if (kind === "public") return ChatRoomKind.PUBLIC;
  if (kind === "mentor_internal") return ChatRoomKind.MENTOR_INTERNAL;
  return ChatRoomKind.MENTOR_COMMUNITY;
}

export function branchModeToUi(mode: ChatBranchMode): BranchModeUi {
  return mode === ChatBranchMode.ONE_WAY ? "one_way" : "two_way";
}

export function branchModeFromUi(mode: BranchModeUi): ChatBranchMode {
  return mode === "one_way" ? ChatBranchMode.ONE_WAY : ChatBranchMode.TWO_WAY;
}

export function senderPolicyToUi(policy: ChatBranchSenderPolicy): SenderPolicyUi {
  return policy === ChatBranchSenderPolicy.MENTOR_AND_MODERATORS
    ? "mentor_and_moderators"
    : "mentor_only";
}

export function senderPolicyFromUi(policy: SenderPolicyUi): ChatBranchSenderPolicy {
  return policy === "mentor_and_moderators"
    ? ChatBranchSenderPolicy.MENTOR_AND_MODERATORS
    : ChatBranchSenderPolicy.MENTOR_ONLY;
}

export function branchVisibilityToUi(
  visibility: ChatBranchVisibility
): BranchVisibilityUi {
  return visibility === ChatBranchVisibility.PRIVATE ? "private" : "public";
}

export function branchVisibilityFromUi(
  visibility: BranchVisibilityUi
): ChatBranchVisibility {
  return visibility === "private"
    ? ChatBranchVisibility.PRIVATE
    : ChatBranchVisibility.PUBLIC;
}

export function branchModeLabel(mode: BranchModeUi | ChatBranchMode): string {
  const ui =
    mode === "one_way" || mode === "two_way" ? mode : branchModeToUi(mode as ChatBranchMode);
  return ui === "one_way" ? "1 arah" : "2 arah";
}

/** Normalize Prisma enum or UI string so TWO_WAY / two_way both match. */
export function isTwoWayMode(mode: BranchModeUi | ChatBranchMode | string | null | undefined): boolean {
  return mode === ChatBranchMode.TWO_WAY || mode === "two_way" || mode === "TWO_WAY";
}

export function isOneWayMode(mode: BranchModeUi | ChatBranchMode | string | null | undefined): boolean {
  return mode === ChatBranchMode.ONE_WAY || mode === "one_way" || mode === "ONE_WAY";
}

/** Prefer a public 2-arah branch so members land on a writable cabang. */
export function pickDefaultBranchId(
  branches: Array<{ id: string; mode: BranchModeUi | ChatBranchMode | string; visibility?: string }> | undefined,
  opts?: { preferTwoWay?: boolean }
): string | null {
  if (!branches?.length) return null;
  const publicBranches = branches.filter(
    (b) => !b.visibility || b.visibility === "public" || b.visibility === "PUBLIC"
  );
  const pool = publicBranches.length ? publicBranches : branches;
  if (opts?.preferTwoWay !== false) {
    const twoWay = pool.find((b) => isTwoWayMode(b.mode));
    if (twoWay) return twoWay.id;
  }
  return pool[0]?.id ?? null;
}

export function branchVisibilityLabel(
  visibility: BranchVisibilityUi | ChatBranchVisibility
): string {
  const ui =
    visibility === "public" || visibility === "private"
      ? visibility
      : branchVisibilityToUi(visibility as ChatBranchVisibility);
  return ui === "private" ? "Privat" : "Publik";
}

export function roomKindLabel(kind: RoomKindUi | ChatRoomKind): string {
  const ui =
    kind === ChatRoomKind.PUBLIC || kind === "public"
      ? "public"
      : kind === ChatRoomKind.MENTOR_INTERNAL || kind === "mentor_internal"
        ? "mentor_internal"
        : "mentor_community";
  if (ui === "public") return "Publik";
  if (ui === "mentor_internal") return "Kolaborasi staf";
  return "Grup mentor";
}

/** True for the single mentor hub room (not platform public, not staff collab). */
export function isMentorHubRoom(
  room: Pick<ChatRoom, "roomKind" | "isStaffCollaboration">
): boolean {
  return room.roomKind === ChatRoomKind.MENTOR_COMMUNITY && !room.isStaffCollaboration;
}

/** Ownership slots: max 1 mentor hub (excludes staff collab & public). */
export function countsTowardMentorOwnership(
  room: Pick<ChatRoom, "roomKind" | "isStaffCollaboration">
): boolean {
  if (room.isStaffCollaboration) return false;
  return room.roomKind === ChatRoomKind.MENTOR_COMMUNITY;
}

export function isPrivateBranch(
  branch: Pick<ChatBranch, "visibility"> | null | undefined
): boolean {
  return branch?.visibility === ChatBranchVisibility.PRIVATE;
}

/**
 * Who may view a branch inside a mentor hub.
 * PUBLIC branches: any room member (and developers for QC).
 * PRIVATE branches: mentor owner role or moderator only; developers blocked.
 */
export function canUserViewBranch(input: {
  room: Pick<ChatRoom, "roomKind" | "isProtected" | "isStaffCollaboration">;
  branch: Pick<ChatBranch, "visibility" | "isActive"> | null;
  membership: Pick<ChatRoomMember, "role"> | null;
  userRole?: string | null;
  /** True when the signed-in user owns this mentor hub (MentorProfile.userId match). */
  isRoomOwner?: boolean;
}): { allowed: boolean; reason?: string } {
  const { room, branch, membership, userRole, isRoomOwner } = input;

  if (room.roomKind === ChatRoomKind.PUBLIC || room.isStaffCollaboration) {
    if (userRole === "developer" && room.isProtected) {
      return { allowed: false, reason: "Developer tidak dapat mengakses chat privat." };
    }
    return { allowed: true };
  }

  if (!branch) {
    return { allowed: true };
  }

  if (!branch.isActive) {
    return { allowed: false, reason: "Cabang ini tidak aktif." };
  }

  if (branch.visibility !== ChatBranchVisibility.PRIVATE) {
    return { allowed: true };
  }

  // PRIVATE branch
  if (userRole === "developer") {
    return {
      allowed: false,
      reason: "Developer tidak dapat mengakses cabang privat mentor.",
    };
  }

  if (isRoomOwner) return { allowed: true };

  if (
    membership?.role === ChatMemberRole.MENTOR ||
    membership?.role === ChatMemberRole.MODERATOR
  ) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Cabang privat — hanya mentor dan moderator yang dapat melihat.",
  };
}

export function canUserSendInBranch(input: {
  room: Pick<ChatRoom, "roomKind" | "isProtected" | "memberOnly" | "isStaffCollaboration">;
  branch: Pick<ChatBranch, "mode" | "senderPolicy" | "isActive" | "visibility"> | null;
  membership: Pick<ChatRoomMember, "role"> | null;
  userRole?: string | null;
  isRoomOwner?: boolean;
}): { allowed: boolean; reason?: string } {
  const { room, branch, membership, userRole, isRoomOwner } = input;

  if (room.roomKind === ChatRoomKind.PUBLIC) {
    if (userRole === "developer" && room.isProtected) {
      return { allowed: false, reason: "Developer tidak dapat mengirim di ruang privat." };
    }
    return { allowed: true };
  }

  if (!membership) {
    return { allowed: false, reason: "Anda belum bergabung di ruang ini." };
  }

  if (!branch) {
    // Flat staff collab threads (mentor↔admin) do not use branches.
    if (room.isStaffCollaboration) {
      return { allowed: true };
    }
    // Mentor hubs should always post into a branch
    if (room.roomKind === ChatRoomKind.MENTOR_COMMUNITY) {
      return { allowed: false, reason: "Pilih cabang chat terlebih dahulu." };
    }
    return { allowed: true };
  }

  const viewCheck = canUserViewBranch({
    room,
    branch,
    membership,
    userRole,
    isRoomOwner,
  });
  if (!viewCheck.allowed) {
    return viewCheck;
  }

  if (!branch.isActive) {
    return { allowed: false, reason: "Cabang ini tidak aktif." };
  }

  // TWO_WAY: any room member who can view the branch may send.
  // senderPolicy applies only to ONE_WAY branches.
  if (isTwoWayMode(branch.mode)) {
    return { allowed: true };
  }

  // ONE_WAY — mentor (owner) always; moderators only when policy allows
  if (membership.role === ChatMemberRole.MENTOR || isRoomOwner) {
    return { allowed: true };
  }
  if (
    branch.senderPolicy === ChatBranchSenderPolicy.MENTOR_AND_MODERATORS &&
    membership.role === ChatMemberRole.MODERATOR
  ) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason:
      branch.senderPolicy === ChatBranchSenderPolicy.MENTOR_AND_MODERATORS
        ? "Cabang 1 arah — hanya mentor dan moderator yang dapat mengirim."
        : "Cabang 1 arah — hanya mentor yang dapat mengirim.",
  };
}

/**
 * How far back a viewer may read room messages.
 * - PUBLIC rooms: full shared history for all members
 * - Staff (room owner, MENTOR/MODERATOR membership, platform ADMIN): full history
 * - Regular MEMBER (mentor hubs / staff collab): only messages at/after joinedAt
 * - Logged-in non-member (or anonymous): no history until they join
 */
export type MessageHistoryScope =
  | { kind: "full" }
  | { kind: "since"; since: Date }
  | { kind: "empty" };

export function resolveMessageHistoryScope(input: {
  membership: Pick<ChatRoomMember, "role" | "joinedAt"> | null;
  userRole?: string | null;
  isRoomOwner?: boolean;
  roomKind?: ChatRoomKind | RoomKindUi | null;
}): MessageHistoryScope {
  const { membership, userRole, isRoomOwner, roomKind } = input;

  if (isRoomOwner) return { kind: "full" };

  const role = (userRole ?? "").toString().toUpperCase();
  if (role === "ADMIN") return { kind: "full" };

  const isPublicRoom =
    roomKind === ChatRoomKind.PUBLIC || roomKind === "public";
  if (isPublicRoom) {
    return membership ? { kind: "full" } : { kind: "empty" };
  }

  if (
    membership?.role === ChatMemberRole.MENTOR ||
    membership?.role === ChatMemberRole.MODERATOR
  ) {
    return { kind: "full" };
  }

  if (membership?.role === ChatMemberRole.MEMBER) {
    return { kind: "since", since: membership.joinedAt };
  }

  return { kind: "empty" };
}

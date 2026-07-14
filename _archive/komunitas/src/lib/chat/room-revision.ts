import type { ChatRoomKind } from "@prisma/client";

import { db } from "@/lib/db";

type BranchFilter = { branchId: string } | { branchId: null } | Record<string, never>;

function branchWhere(
  branchId: string | null,
  roomKind: ChatRoomKind,
  isStaffCollaboration: boolean
): BranchFilter {
  if (branchId) return { branchId };
  if (isStaffCollaboration || roomKind === "PUBLIC") return {};
  return { branchId: null };
}

/** Lightweight fingerprint for detecting message/reaction/edit/delete changes. */
export async function getRoomMessageRevision(
  roomId: string,
  branchId: string | null,
  roomKind: ChatRoomKind,
  isStaffCollaboration: boolean
): Promise<string> {
  const branchFilter = branchWhere(branchId, roomKind, isStaffCollaboration);

  const [msgAgg, reactionAgg, deletedAgg] = await Promise.all([
    db.chatMessage.aggregate({
      where: { roomId, deletedAt: null, ...branchFilter },
      _count: { id: true },
      _max: { createdAt: true, editedAt: true },
    }),
    db.chatMessageReaction.aggregate({
      where: {
        message: { roomId, deletedAt: null, ...branchFilter },
      },
      _max: { createdAt: true },
    }),
    db.chatMessage.aggregate({
      where: { roomId, deletedAt: { not: null }, ...branchFilter },
      _max: { deletedAt: true },
    }),
  ]);

  return [
    msgAgg._count.id,
    msgAgg._max.createdAt?.getTime() ?? 0,
    msgAgg._max.editedAt?.getTime() ?? 0,
    reactionAgg._max.createdAt?.getTime() ?? 0,
    deletedAgg._max.deletedAt?.getTime() ?? 0,
  ].join(":");
}

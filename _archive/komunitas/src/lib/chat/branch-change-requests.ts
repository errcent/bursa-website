import {
  ChangeRequestAction,
  ChangeRequestStatus,
  ChatBranchMode,
  ChatBranchSenderPolicy,
  ChatBranchVisibility,
  ChatRoomKind,
  type ChatBranchChangeRequest,
  type Prisma,
} from "@prisma/client";

import { db } from "@/lib/db";
import {
  branchModeFromUi,
  branchModeToUi,
  branchVisibilityFromUi,
  branchVisibilityToUi,
  senderPolicyFromUi,
  senderPolicyToUi,
  type BranchModeUi,
  type BranchVisibilityUi,
  type SenderPolicyUi,
} from "@/lib/chat/room-kinds";

export type ProposedBranchData = {
  name?: string;
  slug?: string;
  description?: string | null;
  mode?: BranchModeUi;
  senderPolicy?: SenderPolicyUi;
  visibility?: BranchVisibilityUi;
  sortOrder?: number;
};

export type ChatBranchChangeRequestDto = {
  id: string;
  roomId: string;
  roomName: string;
  roomKind: "public" | "mentor_community" | "mentor_internal";
  mentorUserId: string;
  mentorName: string;
  mentorEmail: string;
  branchId: string | null;
  branchName: string | null;
  action: "CREATE" | "UPDATE" | "DELETE";
  summary: string;
  currentSnapshot: unknown;
  proposedData: unknown;
  appliedData: unknown;
  status: "pending" | "approved" | "rejected" | "edited";
  adminNote: string | null;
  reviewedById: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type RequestWithRelations = Prisma.ChatBranchChangeRequestGetPayload<{
  include: {
    room: true;
    branch: true;
    mentorUser: true;
    reviewer: true;
  };
}>;

export const chatBranchChangeRequestInclude = {
  room: true,
  branch: true,
  mentorUser: true,
  reviewer: true,
} as const;

function statusToUi(status: ChangeRequestStatus): ChatBranchChangeRequestDto["status"] {
  if (status === ChangeRequestStatus.PENDING) return "pending";
  if (status === ChangeRequestStatus.APPROVED) return "approved";
  if (status === ChangeRequestStatus.EDITED) return "edited";
  return "rejected";
}

function roomKindDto(
  kind: ChatRoomKind
): ChatBranchChangeRequestDto["roomKind"] {
  if (kind === ChatRoomKind.PUBLIC) return "public";
  if (kind === ChatRoomKind.MENTOR_INTERNAL) return "mentor_internal";
  return "mentor_community";
}

export function mapChatBranchChangeRequest(
  row: RequestWithRelations
): ChatBranchChangeRequestDto {
  return {
    id: row.id,
    roomId: row.roomId,
    roomName: row.room.name,
    roomKind: roomKindDto(row.room.roomKind),
    mentorUserId: row.mentorUserId,
    mentorName: row.mentorUser.nama,
    mentorEmail: row.mentorUser.email,
    branchId: row.branchId,
    branchName: row.branch?.name ?? null,
    action: row.action,
    summary: row.summary,
    currentSnapshot: row.currentSnapshot,
    proposedData: row.proposedData,
    appliedData: row.appliedData,
    status: statusToUi(row.status),
    adminNote: row.adminNote,
    reviewedById: row.reviewedById,
    reviewerName: row.reviewer?.nama ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function slugifyBranch(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function captureBranchSnapshot(
  branchId: string | null | undefined
): Promise<Prisma.InputJsonValue | null> {
  if (!branchId) return null;
  const branch = await db.chatBranch.findUnique({ where: { id: branchId } });
  if (!branch) return null;
  return {
    name: branch.name,
    slug: branch.slug,
    description: branch.description,
    mode: branchModeToUi(branch.mode),
    senderPolicy: senderPolicyToUi(branch.senderPolicy),
    visibility: branchVisibilityToUi(branch.visibility),
    sortOrder: branch.sortOrder,
    isActive: branch.isActive,
  };
}

export async function applyChatBranchChangeRequest(
  request: ChatBranchChangeRequest,
  payload: Record<string, unknown> | Prisma.InputJsonValue | null
): Promise<Prisma.InputJsonValue | null> {
  const data = (payload ?? request.proposedData) as ProposedBranchData | null;

  const room = await db.chatRoom.findUnique({ where: { id: request.roomId } });
  if (!room) throw new Error("Ruang chat tidak ditemukan.");
  if (room.roomKind !== ChatRoomKind.MENTOR_COMMUNITY || room.isStaffCollaboration) {
    throw new Error("Cabang hanya untuk grup mentor.");
  }

  if (request.action === ChangeRequestAction.CREATE) {
    if (!data?.name?.trim()) throw new Error("Nama cabang wajib diisi.");
    const slug = data.slug?.trim() || slugifyBranch(data.name);
    const count = await db.chatBranch.count({ where: { roomId: request.roomId } });
    const mode = data.mode ? branchModeFromUi(data.mode) : ChatBranchMode.TWO_WAY;
    const senderPolicy = data.senderPolicy
      ? senderPolicyFromUi(data.senderPolicy)
      : ChatBranchSenderPolicy.MENTOR_ONLY;
    const visibility = data.visibility
      ? branchVisibilityFromUi(data.visibility)
      : ChatBranchVisibility.PUBLIC;

    const created = await db.chatBranch.create({
      data: {
        roomId: request.roomId,
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || null,
        mode,
        senderPolicy,
        visibility,
        sortOrder: data.sortOrder ?? count,
        isActive: true,
      },
    });

    return {
      id: created.id,
      name: created.name,
      slug: created.slug,
      mode: branchModeToUi(created.mode),
      senderPolicy: senderPolicyToUi(created.senderPolicy),
      visibility: branchVisibilityToUi(created.visibility),
      sortOrder: created.sortOrder,
    };
  }

  if (!request.branchId) throw new Error("branchId diperlukan.");

  if (request.action === ChangeRequestAction.DELETE) {
    await db.chatBranch.update({
      where: { id: request.branchId },
      data: { isActive: false },
    });
    return { deletedBranchId: request.branchId, softDeleted: true };
  }

  // UPDATE
  const patch: Prisma.ChatBranchUpdateInput = {};
  if (data?.name?.trim()) patch.name = data.name.trim();
  if (data?.slug?.trim()) patch.slug = data.slug.trim();
  if (data?.description !== undefined) {
    patch.description = data.description?.trim() || null;
  }
  if (data?.mode) patch.mode = branchModeFromUi(data.mode);
  if (data?.senderPolicy) patch.senderPolicy = senderPolicyFromUi(data.senderPolicy);
  if (data?.visibility) patch.visibility = branchVisibilityFromUi(data.visibility);
  if (typeof data?.sortOrder === "number") patch.sortOrder = data.sortOrder;

  const updated = await db.chatBranch.update({
    where: { id: request.branchId },
    data: patch,
  });

  return {
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    description: updated.description,
    mode: branchModeToUi(updated.mode),
    senderPolicy: senderPolicyToUi(updated.senderPolicy),
    visibility: branchVisibilityToUi(updated.visibility),
    sortOrder: updated.sortOrder,
    isActive: updated.isActive,
  };
}

/** Default branches for a new mentor hub: public discussion + private internal. */
export async function seedDefaultBranches(roomId: string) {
  const existing = await db.chatBranch.count({ where: { roomId } });
  if (existing > 0) return;

  await db.chatBranch.createMany({
    data: [
      {
        roomId,
        name: "Pengumuman",
        slug: "pengumuman",
        description: "Cabang publik 1 arah — hanya mentor yang mengirim.",
        mode: ChatBranchMode.ONE_WAY,
        senderPolicy: ChatBranchSenderPolicy.MENTOR_ONLY,
        visibility: ChatBranchVisibility.PUBLIC,
        sortOrder: 0,
      },
      {
        roomId,
        name: "Diskusi",
        slug: "diskusi",
        description: "Cabang publik 2 arah — anggota dapat berbalas dengan mentor.",
        mode: ChatBranchMode.TWO_WAY,
        senderPolicy: ChatBranchSenderPolicy.MENTOR_ONLY,
        visibility: ChatBranchVisibility.PUBLIC,
        sortOrder: 1,
      },
      {
        roomId,
        name: "Internal",
        slug: "internal",
        description: "Cabang privat — hanya mentor dan moderator.",
        mode: ChatBranchMode.ONE_WAY,
        senderPolicy: ChatBranchSenderPolicy.MENTOR_AND_MODERATORS,
        visibility: ChatBranchVisibility.PRIVATE,
        sortOrder: 2,
      },
    ],
  });
}

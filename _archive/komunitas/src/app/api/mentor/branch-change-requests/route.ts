import {
  ChangeRequestAction,
  ChangeRequestStatus,
  type Prisma,
} from "@prisma/client";
import { NextResponse } from "next/server";

import {
  captureBranchSnapshot,
  chatBranchChangeRequestInclude,
  mapChatBranchChangeRequest,
} from "@/lib/chat/branch-change-requests";
import { db } from "@/lib/db";
import { requireMentor, unauthorizedMentor } from "@/lib/mentor/server";

export async function GET(request: Request) {
  const mentor = await requireMentor(request);
  if (!mentor) return unauthorizedMentor();

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    let status: ChangeRequestStatus | undefined;
    if (statusParam === "pending") status = ChangeRequestStatus.PENDING;
    if (statusParam === "approved") status = ChangeRequestStatus.APPROVED;
    if (statusParam === "rejected") status = ChangeRequestStatus.REJECTED;

    const items = await db.chatBranchChangeRequest.findMany({
      where: {
        mentorUserId: mentor.id,
        ...(status ? { status } : {}),
      },
      include: chatBranchChangeRequestInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items.map(mapChatBranchChangeRequest));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat usulan cabang." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const mentor = await requireMentor(request);
  if (!mentor) return unauthorizedMentor();

  try {
    const body = (await request.json()) as {
      roomId?: string;
      branchId?: string | null;
      action?: string;
      summary?: string;
      proposedData?: Record<string, unknown> | null;
    };

    const action = body.action as ChangeRequestAction | undefined;
    if (
      !body.roomId ||
      !body.summary?.trim() ||
      !action ||
      !Object.values(ChangeRequestAction).includes(action)
    ) {
      return NextResponse.json(
        { error: "Data usulan cabang tidak lengkap atau tidak valid." },
        { status: 400 }
      );
    }

    const room = await db.chatRoom.findFirst({
      where: {
        id: body.roomId,
        mentorId: mentor.mentorProfile!.id,
        isStaffCollaboration: false,
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Ruang tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    if (action !== ChangeRequestAction.CREATE && !body.branchId) {
      return NextResponse.json(
        { error: "branchId wajib untuk update/hapus cabang." },
        { status: 400 }
      );
    }

    if (body.branchId) {
      const branch = await db.chatBranch.findFirst({
        where: { id: body.branchId, roomId: room.id },
      });
      if (!branch) {
        return NextResponse.json({ error: "Cabang tidak ditemukan." }, { status: 404 });
      }
    }

    const currentSnapshot =
      action === ChangeRequestAction.CREATE
        ? null
        : await captureBranchSnapshot(body.branchId);

    if (action !== ChangeRequestAction.CREATE && currentSnapshot === null) {
      return NextResponse.json({ error: "Cabang target tidak ditemukan." }, { status: 404 });
    }

    const item = await db.chatBranchChangeRequest.create({
      data: {
        roomId: room.id,
        mentorUserId: mentor.id,
        branchId: body.branchId ?? null,
        action,
        summary: body.summary.trim(),
        currentSnapshot: currentSnapshot ?? undefined,
        proposedData:
          body.proposedData === undefined || body.proposedData === null
            ? undefined
            : (body.proposedData as Prisma.InputJsonValue),
        status: ChangeRequestStatus.PENDING,
      },
      include: chatBranchChangeRequestInclude,
    });

    return NextResponse.json(mapChatBranchChangeRequest(item), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengirim usulan cabang." }, { status: 500 });
  }
}

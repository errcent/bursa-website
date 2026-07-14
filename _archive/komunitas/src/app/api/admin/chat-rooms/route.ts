import { ChatRoomKind } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { seedDefaultBranches } from "@/lib/chat/branch-change-requests";
import { assertMentorRoomSlotAvailable, ensureMentorOwnerMembership } from "@/lib/chat/db-rooms";
import { mapChatRoom, requireAdmin, slugify, tierFromUi, unauthorized } from "@/lib/admin/server";
import type { ChatRoomFormInput } from "@/lib/admin/types";

function roomKindFromForm(
  value: ChatRoomFormInput["roomKind"] | undefined
): ChatRoomKind {
  if (value === "public") return ChatRoomKind.PUBLIC;
  // mentor_internal form value (legacy) maps to hub — privacy is on branches
  return ChatRoomKind.MENTOR_COMMUNITY;
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const rooms = await db.chatRoom.findMany({
      include: {
        mentor: { include: { user: true } },
        branches: true,
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rooms.map(mapChatRoom));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat chat room." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const input = (await request.json()) as ChatRoomFormInput;
    const slug = slugify(input.name);
    const roomKind = roomKindFromForm(input.roomKind);

    if (roomKind === ChatRoomKind.PUBLIC) {
      const room = await db.chatRoom.create({
        data: {
          mentorId: null,
          name: input.name,
          slug,
          description: input.description,
          roomKind: ChatRoomKind.PUBLIC,
          tier: tierFromUi(input.tier === "Internal" ? "Pemula" : input.tier),
          isProtected: false,
          screenshotProtection: input.screenshotProtection,
          memberOnly: false,
          isActive: true,
        },
        include: {
          mentor: { include: { user: true } },
          branches: true,
          _count: { select: { members: true } },
        },
      });

      await db.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: "CREATE_CHAT_ROOM",
          entityType: "chat_room",
          entityId: room.id,
          changes: { roomKind: "PUBLIC" },
        },
      });

      return NextResponse.json(mapChatRoom(room), { status: 201 });
    }

    if (!input.mentorId) {
      return NextResponse.json({ error: "mentorId wajib untuk ruang mentor." }, { status: 400 });
    }

    const slot = await assertMentorRoomSlotAvailable(
      input.mentorId,
      ChatRoomKind.MENTOR_COMMUNITY
    );
    if (!slot.ok) {
      return NextResponse.json({ error: slot.error }, { status: 409 });
    }

    const room = await db.chatRoom.create({
      data: {
        mentorId: input.mentorId,
        name: input.name,
        slug,
        description: input.description,
        roomKind: ChatRoomKind.MENTOR_COMMUNITY,
        tier: tierFromUi(input.tier === "Internal" ? "Pemula" : input.tier),
        isProtected: input.isProtected,
        screenshotProtection: input.screenshotProtection,
        memberOnly: true,
        isActive: true,
      },
      include: {
        mentor: { include: { user: true } },
        branches: true,
        _count: { select: { members: true } },
      },
    });

    await seedDefaultBranches(room.id);
    await ensureMentorOwnerMembership({
      roomId: room.id,
      mentorProfileId: input.mentorId,
    });

    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "CREATE_CHAT_ROOM",
        entityType: "chat_room",
        entityId: room.id,
        changes: { roomKind: ChatRoomKind.MENTOR_COMMUNITY },
      },
    });

    return NextResponse.json(mapChatRoom(room), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal membuat chat room." }, { status: 500 });
  }
}

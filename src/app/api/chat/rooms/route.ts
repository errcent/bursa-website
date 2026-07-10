import { ChatRoomKind, UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { seedDefaultBranches } from "@/lib/chat/branch-change-requests";
import {
  assertMentorRoomSlotAvailable,
  ensureMentorOwnerMembership,
  healHubMembershipsForUserEnrollments,
  listChatRoomsForViewer,
  resolveChatRoomViewerFromEmail,
} from "@/lib/chat/db-rooms";
import { db } from "@/lib/db";
import { createChatRoomSchema } from "@/lib/validations/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const mentorId = searchParams.get("mentorId");
    const tier = searchParams.get("tier");
    const roomKind = searchParams.get("roomKind");
    const email = request.headers.get("x-user-email");
    const viewer = await resolveChatRoomViewerFromEmail(email, {
      createIfMissing: true,
      userId: request.headers.get("x-user-id"),
      name: request.headers.get("x-user-name"),
      role: request.headers.get("x-user-role"),
    });

    // Mentors & learners: privacy/subscription-scoped lists. Ignore broad filters
    // that would leak hubs the viewer should not see.
    if (
      viewer &&
      (viewer.role === UserRole.MENTOR || viewer.role === UserRole.LEARNER)
    ) {
      // Learners: repair Enrollment → mentor hub membership before listing
      // (fixes accounts that only landed in Komunitas Publik).
      if (viewer.role === UserRole.LEARNER) {
        await healHubMembershipsForUserEnrollments(viewer.id);
      }
      const rooms = await listChatRoomsForViewer(viewer);
      const filtered = rooms.filter((room) => {
        if (mentorId && room.mentorId !== mentorId) return false;
        if (roomKind) {
          const kindMap: Record<string, string> = {
            PUBLIC: "public",
            MENTOR_COMMUNITY: "mentor_community",
            MENTOR_INTERNAL: "mentor_internal",
          };
          const want = kindMap[roomKind] ?? roomKind.toLowerCase();
          if (room.roomKind !== want) return false;
        }
        if (tier) {
          const tierMap: Record<string, string> = {
            PEMULA: "Pemula",
            MENENGAH: "Menengah",
            MAHIR: "Mahir",
            INTERNAL: "Internal",
          };
          const wantTier = tierMap[tier] ?? tier;
          if (room.tier && room.tier !== wantTier) return false;
          if (!room.tier && wantTier !== "Internal") return false;
        }
        return true;
      });
      return jsonOk({ rooms: filtered });
    }

    const rooms = await db.chatRoom.findMany({
      where: {
        isActive: true,
        isStaffCollaboration: false,
        ...(mentorId ? { mentorId } : {}),
        ...(tier ? { tier: tier as "PEMULA" | "MENENGAH" | "MAHIR" | "INTERNAL" } : {}),
        ...(roomKind ? { roomKind: roomKind as ChatRoomKind } : {}),
      },
      include: {
        mentor: {
          select: {
            id: true,
            slug: true,
            initials: true,
            title: true,
            user: { select: { nama: true } },
          },
        },
        branches: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        _count: {
          select: { members: true, messages: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({ rooms });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createChatRoomSchema.parse(await request.json());
    // New mentor rooms are always hubs; MENTOR_INTERNAL is reserved for staff collab.
    let roomKind = (body.roomKind as ChatRoomKind | undefined) ?? ChatRoomKind.MENTOR_COMMUNITY;
    if (roomKind === ChatRoomKind.MENTOR_INTERNAL) {
      roomKind = ChatRoomKind.MENTOR_COMMUNITY;
    }

    if (roomKind === ChatRoomKind.PUBLIC) {
      const existingPublic = await db.chatRoom.findFirst({
        where: { slug: body.slug, roomKind: ChatRoomKind.PUBLIC },
      });
      if (existingPublic) {
        return jsonError("Slug ruang publik sudah dipakai", 409);
      }

      const room = await db.chatRoom.create({
        data: {
          mentorId: null,
          name: body.name,
          slug: body.slug,
          description: body.description,
          roomKind: ChatRoomKind.PUBLIC,
          tier: body.tier,
          isProtected: false,
          screenshotProtection: body.screenshotProtection ?? false,
          memberOnly: false,
          isActive: true,
        },
        include: {
          mentor: {
            select: { id: true, slug: true, initials: true, title: true },
          },
          branches: true,
        },
      });

      return jsonOk({ room }, 201);
    }

    if (!body.mentorId) {
      return jsonError("mentorId wajib untuk ruang mentor", 400);
    }

    const slot = await assertMentorRoomSlotAvailable(body.mentorId, roomKind);
    if (!slot.ok) return jsonError(slot.error, 409);

    const existing = await db.chatRoom.findFirst({
      where: { mentorId: body.mentorId, slug: body.slug },
    });
    if (existing) {
      return jsonError("Room slug already exists for this mentor", 409);
    }

    const room = await db.chatRoom.create({
      data: {
        mentorId: body.mentorId,
        name: body.name,
        slug: body.slug,
        description: body.description,
        roomKind: ChatRoomKind.MENTOR_COMMUNITY,
        tier: body.tier === "INTERNAL" ? "PEMULA" : body.tier,
        isProtected: body.isProtected ?? false,
        screenshotProtection: body.screenshotProtection ?? false,
        memberOnly: body.memberOnly ?? true,
        isActive: true,
      },
      include: {
        mentor: {
          select: { id: true, slug: true, initials: true, title: true },
        },
        branches: true,
      },
    });

    await seedDefaultBranches(room.id);
    await ensureMentorOwnerMembership({
      roomId: room.id,
      mentorProfileId: body.mentorId,
    });

    return jsonOk({ room }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

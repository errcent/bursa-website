import { NextRequest } from "next/server";

import { handleApiError, jsonError } from "@/lib/api-utils";
import {
  assertCanAccessChatRoom,
  resolveChatRoomViewerFromEmail,
} from "@/lib/chat/db-rooms";
import { getRoomMessageRevision } from "@/lib/chat/room-revision";
import { db } from "@/lib/db";
import { resolveRequestUser } from "@/lib/lesson-qa/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** Vercel streaming limit; client reconnects automatically. */
export const maxDuration = 60;

const POLL_MS = 1500;
const HEARTBEAT_MS = 15000;

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

async function resolveUser(request: NextRequest) {
  const email = request.headers.get("x-user-email")?.trim().toLowerCase();
  const headerUserId = request.headers.get("x-user-id")?.trim();
  const headerName = request.headers.get("x-user-name")?.trim();
  const headerRole = request.headers.get("x-user-role")?.trim();

  if (!email && !headerUserId) return null;

  return resolveRequestUser(
    {
      userId: headerUserId || "",
      email: email || undefined,
      name: headerName || undefined,
      role: headerRole || undefined,
    },
    { createIfMissing: true }
  );
}

function sseChunk(event: string, data: string): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${data}\n\n`);
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { roomId } = await context.params;
    const branchId = request.nextUrl.searchParams.get("branchId");

    const room = await db.chatRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        roomKind: true,
        isStaffCollaboration: true,
        mentorId: true,
        isProtected: true,
        isActive: true,
      },
    });
    if (!room) {
      return jsonError("Chat room not found", 404);
    }

    const user = await resolveUser(request);
    const viewer = user
      ? {
          id: user.id,
          role: user.role,
          mentorProfileId:
            (
              await db.mentorProfile.findUnique({
                where: { userId: user.id },
                select: { id: true },
              })
            )?.id ?? null,
        }
      : await resolveChatRoomViewerFromEmail(
          request.headers.get("x-user-email"),
          {
            createIfMissing: true,
            userId: request.headers.get("x-user-id"),
            name: request.headers.get("x-user-name"),
            role: request.headers.get("x-user-role"),
          }
        );

    const access = await assertCanAccessChatRoom({ room, viewer });
    if (!access.ok) {
      return jsonError(access.error, access.status);
    }

    const effectiveBranchId = branchId?.trim() || null;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let lastRevision = "";
        let lastHeartbeat = Date.now();
        let closed = false;

        const close = () => {
          if (closed) return;
          closed = true;
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        };

        request.signal.addEventListener("abort", close);

        const tick = async () => {
          if (closed || request.signal.aborted) return;

          try {
            const revision = await getRoomMessageRevision(
              roomId,
              effectiveBranchId,
              room.roomKind,
              room.isStaffCollaboration
            );

            if (revision !== lastRevision) {
              lastRevision = revision;
              controller.enqueue(sseChunk("update", revision));
            } else if (Date.now() - lastHeartbeat >= HEARTBEAT_MS) {
              lastHeartbeat = Date.now();
              controller.enqueue(sseChunk("ping", "{}"));
            }
          } catch {
            controller.enqueue(sseChunk("error", '{"message":"stream_error"}'));
            close();
            return;
          }

          if (!closed && !request.signal.aborted) {
            setTimeout(() => void tick(), POLL_MS);
          }
        };

        controller.enqueue(sseChunk("ready", "{}"));
        void tick();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

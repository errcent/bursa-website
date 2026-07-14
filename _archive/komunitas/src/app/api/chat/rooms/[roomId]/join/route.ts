import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import {
  joinMentorHubIfEligible,
  resolveChatRoomViewerFromEmail,
} from "@/lib/chat/db-rooms";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

/**
 * Subscribe / join a chat room.
 * - PUBLIC: any logged-in user
 * - MENTOR_COMMUNITY: requires enrollment in a course by that mentor
 *
 * Bridges client-auth (localStorage) users into Prisma when missing.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { roomId } = await context.params;
    const viewer = await resolveChatRoomViewerFromEmail(
      request.headers.get("x-user-email"),
      {
        createIfMissing: true,
        userId: request.headers.get("x-user-id"),
        name: request.headers.get("x-user-name"),
        role: request.headers.get("x-user-role"),
      }
    );
    if (!viewer) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const result = await joinMentorHubIfEligible({
      userId: viewer.id,
      roomId,
    });
    if (!result.ok) {
      return jsonError(result.error, result.status);
    }

    return jsonOk({ joined: true, roomId: result.roomId });
  } catch (error) {
    return handleApiError(error);
  }
}

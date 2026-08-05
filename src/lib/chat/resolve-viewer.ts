import { resolveTrustedEmail } from "@/lib/auth/request-identity";
import {
  resolveChatRoomViewerFromEmail,
  type ChatRoomViewer,
} from "@/lib/chat/db-rooms";

/** Resolve chat viewer from a trusted session (not raw x-user-email). */
export async function resolveTrustedChatViewer(
  request: Request,
  options?: {
    createIfMissing?: boolean;
    userId?: string | null;
    name?: string | null;
    role?: string | null;
  }
): Promise<ChatRoomViewer | null> {
  const email = await resolveTrustedEmail(request);
  if (!email) return null;

  return resolveChatRoomViewerFromEmail(email, {
    createIfMissing: options?.createIfMissing ?? false,
    userId: options?.userId,
    name: options?.name,
    role: options?.role,
  });
}

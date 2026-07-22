import { getSession } from "@/lib/auth/client";
import type { AdminCourse } from "@/lib/admin/types";
import type { ChangeRequestDto } from "@/lib/mentor/change-requests";

export type { ChangeRequestDto };

export type MentorAdminChatSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tier: "Internal";
  isProtected: boolean;
  memberCount: number;
  mentorId: string;
  mentorName: string;
  lastMessage: {
    content: string;
    authorName: string;
    createdAt: string;
  } | null;
  href: string;
  currentUserId?: string;
};

function authHeaders(): HeadersInit {
  const session = getSession();
  if (!session) return {};
  return {
    "Content-Type": "application/json",
    "x-user-email": session.email,
  };
}

async function mentorRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/mentor${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const json = JSON.parse(text) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      /* keep text */
    }
    throw new Error(message || "Permintaan gagal");
  }
  return res.json() as Promise<T>;
}

export async function fetchMentorCourses() {
  return mentorRequest<AdminCourse[]>("/courses");
}

export async function fetchMentorChangeRequests(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return mentorRequest<ChangeRequestDto[]>(`/change-requests${q}`);
}

export async function createMentorChangeRequest(body: {
  courseId: string;
  targetType: "COURSE" | "MODULE" | "LESSON";
  action: "CREATE" | "UPDATE" | "DELETE";
  moduleId?: string | null;
  lessonId?: string | null;
  summary: string;
  proposedData?: Record<string, unknown> | null;
}) {
  return mentorRequest<ChangeRequestDto>("/change-requests", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchMentorCollaborationChat() {
  return mentorRequest<MentorAdminChatSummary>("/collaboration-chat");
}

export type ChatBranchChangeRequestDto =
  import("@/lib/chat/branch-change-requests").ChatBranchChangeRequestDto;

export async function fetchMentorChatRooms() {
  return mentorRequest<import("@/lib/chat/types").ChatRoom[]>("/chat-rooms");
}

export type MentorProfileSummary = {
  id: string;
  slug: string;
  title: string;
  initials: string;
  avatarUrl: string | null;
  userId: string;
  name: string;
  email: string;
};

export async function fetchMentorProfile() {
  return mentorRequest<MentorProfileSummary>("/profile");
}

export async function fetchMentorBranchChangeRequests(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return mentorRequest<ChatBranchChangeRequestDto[]>(`/branch-change-requests${q}`);
}

export async function createMentorBranchChangeRequest(body: {
  roomId: string;
  branchId?: string | null;
  action: "CREATE" | "UPDATE" | "DELETE";
  summary: string;
  proposedData?: Record<string, unknown> | null;
}) {
  return mentorRequest<ChatBranchChangeRequestDto>("/branch-change-requests", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

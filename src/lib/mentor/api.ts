import { getSession } from "@/lib/auth/client";
import type { AdminCourse } from "@/lib/admin/types";
import type { ChangeRequestDto } from "@/lib/mentor/change-requests";

export type { ChangeRequestDto };

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

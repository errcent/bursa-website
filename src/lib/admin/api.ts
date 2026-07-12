import { getSession } from "@/lib/auth/client";
import {
  createMockChatRoom,
  createMockCourse,
  createMockLesson,
  createMockMentor,
  createMockModule,
  deleteMockCourse,
  deleteMockLesson,
  deleteMockMentor,
  deleteMockModule,
  getMockChatRooms,
  getMockCourse,
  getMockCourses,
  getMockMentors,
  getMockModeration,
  getMockRevenueReport,
  getMockStats,
  getMockUsers,
  reorderMockCurriculum,
  resolveMockModeration,
  updateMockChatRoom,
  updateMockCourse,
  updateMockLesson,
  updateMockMentor,
  updateMockModule,
  updateMockUserRole,
} from "./mock";
import type {
  AdminChatRoom,
  AdminCourse,
  AdminLessonInput,
  AdminMentor,
  AdminModerationItem,
  AdminModuleInput,
  AdminRevenueReport,
  AdminStats,
  AdminUser,
  AvailabilitySlotInput,
  AdminAvailabilitySlot,
  MentorSessionConfig,
  ChatRoomFormInput,
  CourseFormInput,
  CurriculumReorderInput,
  LessonFormInput,
  MentorFormInput,
  ModerationDecision,
  ModuleFormInput,
} from "./types";
import type { PlaylistDetail, PlaylistSummary } from "@/lib/playlist/types";

type ApiResult<T> = { data: T; source: "api" | "mock" };

function authHeaders(): HeadersInit {
  const session = getSession();
  if (!session) return {};
  return {
    "Content-Type": "application/json",
    "x-user-email": session.email,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`/api/admin${path}`, {
      ...init,
      headers: {
        ...authHeaders(),
        ...(init?.headers ?? {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      let message = text;
      try {
        const json = JSON.parse(text) as { error?: string; detail?: string };
        if (json.error) {
          message = json.detail ? `${json.error} (${json.detail})` : json.error;
        }
      } catch {
        /* keep text */
      }
      throw new Error(message || "Permintaan admin gagal");
    }

    const data = (await res.json()) as T;
    return { data, source: "api" };
  } catch (error) {
    // Collaboration chat has no mock — surface the real failure.
    if (path === "/collaboration-chat") {
      throw error instanceof Error ? error : new Error("Gagal memuat ruang kolaborasi.");
    }
    try {
      return { data: await mockFallback<T>(path, init), source: "mock" };
    } catch {
      throw error instanceof Error ? error : new Error("Permintaan admin gagal");
    }
  }
}

async function mockFallback<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? "GET";
  const body = init?.body ? (JSON.parse(init.body as string) as Record<string, unknown>) : null;

  if (path === "/stats" && method === "GET") return getMockStats() as T;
  if (path === "/pendapatan" && method === "GET") return getMockRevenueReport() as T;
  if (path === "/mentors" && method === "GET") return getMockMentors() as T;
  if (path === "/courses" && method === "GET") return getMockCourses() as T;
  if (path === "/chat-rooms" && method === "GET") return getMockChatRooms() as T;
  if (path === "/moderation" && method === "GET") return getMockModeration() as T;
  if (path === "/users" && method === "GET") return getMockUsers() as T;

  if (path === "/mentors" && method === "POST") {
    const input = body as unknown as MentorFormInput;
    return createMockMentor({
      ...input,
      slug: input.name.toLowerCase().replace(/\s+/g, "-"),
    }) as T;
  }

  if (path.startsWith("/mentors/") && method === "PATCH") {
    const id = path.split("/")[2];
    return updateMockMentor(id, body as Partial<AdminMentor>) as T;
  }

  if (path.startsWith("/mentors/") && method === "DELETE") {
    const id = path.split("/")[2];
    deleteMockMentor(id);
    return { ok: true } as T;
  }

  if (path === "/courses" && method === "POST") {
    return createMockCourse(body as unknown as CourseFormInput) as T;
  }

  if (path.match(/^\/courses\/[^/]+$/) && method === "GET") {
    const id = path.split("/")[2];
    const course = getMockCourse(id);
    if (!course) throw new Error("Course not found");
    return course as T;
  }

  if (path.match(/^\/courses\/[^/]+$/) && method === "PATCH") {
    const id = path.split("/")[2];
    return updateMockCourse(id, body as Partial<AdminCourse>) as T;
  }

  if (path.match(/^\/courses\/[^/]+$/) && method === "DELETE") {
    const id = path.split("/")[2];
    deleteMockCourse(id);
    return { ok: true } as T;
  }

  if (path.match(/^\/courses\/[^/]+\/modules$/) && method === "POST") {
    const courseId = path.split("/")[2];
    const input = body as unknown as ModuleFormInput;
    return createMockModule(courseId, input.title) as T;
  }

  if (path.match(/^\/courses\/[^/]+\/modules\/[^/]+$/) && method === "PATCH") {
    const [, , courseId, , moduleId] = path.split("/");
    return updateMockModule(courseId, moduleId, body as Partial<ModuleFormInput>) as T;
  }

  if (path.match(/^\/courses\/[^/]+\/modules\/[^/]+$/) && method === "DELETE") {
    const [, , courseId, , moduleId] = path.split("/");
    deleteMockModule(courseId, moduleId);
    return { ok: true } as T;
  }

  if (path.match(/^\/courses\/[^/]+\/modules\/[^/]+\/lessons$/) && method === "POST") {
    const [, , courseId, , moduleId] = path.split("/");
    return createMockLesson(courseId, moduleId, body as unknown as LessonFormInput) as T;
  }

  if (
    path.match(/^\/courses\/[^/]+\/modules\/[^/]+\/lessons\/[^/]+$/) &&
    method === "PATCH"
  ) {
    const [, , courseId, , moduleId, , lessonId] = path.split("/");
    return updateMockLesson(
      courseId,
      moduleId,
      lessonId,
      body as Partial<LessonFormInput>
    ) as T;
  }

  if (
    path.match(/^\/courses\/[^/]+\/modules\/[^/]+\/lessons\/[^/]+$/) &&
    method === "DELETE"
  ) {
    const [, , courseId, , moduleId, , lessonId] = path.split("/");
    deleteMockLesson(courseId, moduleId, lessonId);
    return { ok: true } as T;
  }

  if (path.match(/^\/courses\/[^/]+\/curriculum$/) && method === "PUT") {
    const courseId = path.split("/")[2];
    const input = body as unknown as CurriculumReorderInput;
    return reorderMockCurriculum(courseId, input.modules) as T;
  }

  if (path === "/chat-rooms" && method === "POST") {
    return createMockChatRoom(body as unknown as ChatRoomFormInput) as T;
  }

  if (path.startsWith("/chat-rooms/") && method === "PATCH") {
    const id = path.split("/")[2];
    return updateMockChatRoom(id, body as Partial<AdminChatRoom>) as T;
  }

  if (path.startsWith("/moderation/") && method === "PATCH") {
    const id = path.split("/")[2];
    const decision = (body as { decision: ModerationDecision }).decision;
    return resolveMockModeration(id, decision) as T;
  }

  if (path.startsWith("/users/") && method === "PATCH") {
    const id = path.split("/")[2];
    const role = (body as { role: AdminUser["role"] }).role;
    return updateMockUserRole(id, role) as T;
  }

  if (path.startsWith("/branch-change-requests")) {
    return [] as T;
  }

  if (path === "/collaboration-chat") {
    throw new Error("Ruang kolaborasi mentor–admin tidak tersedia (API gagal).");
  }

  throw new Error("Mock fallback tidak tersedia untuk endpoint ini.");
}

export async function fetchStats(): Promise<ApiResult<AdminStats>> {
  return request<AdminStats>("/stats");
}

export async function fetchRevenueReport(): Promise<ApiResult<AdminRevenueReport>> {
  return request<AdminRevenueReport>("/pendapatan");
}

export async function fetchMentors(): Promise<ApiResult<AdminMentor[]>> {
  return request<AdminMentor[]>("/mentors");
}

export async function createMentor(input: MentorFormInput): Promise<ApiResult<AdminMentor>> {
  return request<AdminMentor>("/mentors", { method: "POST", body: JSON.stringify(input) });
}

export async function updateMentor(
  id: string,
  input: Partial<MentorFormInput>
): Promise<ApiResult<AdminMentor>> {
  return request<AdminMentor>(`/mentors/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteMentor(id: string): Promise<ApiResult<{ ok: boolean }>> {
  return request<{ ok: boolean }>(`/mentors/${id}`, { method: "DELETE" });
}

export async function fetchMentorSlots(
  mentorId: string
): Promise<ApiResult<{ mentor: MentorSessionConfig; slots: AdminAvailabilitySlot[] }>> {
  return request(`/mentors/${mentorId}/availability-slots`);
}

export async function createMentorSlot(
  mentorId: string,
  input: AvailabilitySlotInput
): Promise<ApiResult<AdminAvailabilitySlot>> {
  return request<AdminAvailabilitySlot>(`/mentors/${mentorId}/availability-slots`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateMentorSlot(
  mentorId: string,
  slotId: string,
  input: Partial<AvailabilitySlotInput>
): Promise<ApiResult<AdminAvailabilitySlot>> {
  return request<AdminAvailabilitySlot>(
    `/mentors/${mentorId}/availability-slots/${slotId}`,
    { method: "PATCH", body: JSON.stringify(input) }
  );
}

export async function deleteMentorSlot(
  mentorId: string,
  slotId: string
): Promise<ApiResult<{ ok: boolean }>> {
  return request<{ ok: boolean }>(`/mentors/${mentorId}/availability-slots/${slotId}`, {
    method: "DELETE",
  });
}

export async function fetchCourses(): Promise<ApiResult<AdminCourse[]>> {
  return request<AdminCourse[]>("/courses");
}

export async function createCourse(input: CourseFormInput): Promise<ApiResult<AdminCourse>> {
  return request<AdminCourse>("/courses", { method: "POST", body: JSON.stringify(input) });
}

export async function updateCourse(
  id: string,
  input: Partial<CourseFormInput>
): Promise<ApiResult<AdminCourse>> {
  return request<AdminCourse>(`/courses/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteCourse(id: string): Promise<ApiResult<{ ok: boolean }>> {
  return request<{ ok: boolean }>(`/courses/${id}`, { method: "DELETE" });
}

export async function fetchCourse(id: string): Promise<ApiResult<AdminCourse>> {
  return request<AdminCourse>(`/courses/${id}`);
}

export async function uploadCourseThumbnail(file: File): Promise<ApiResult<{ url: string }>> {
  const session = getSession();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/admin/uploads/thumbnail", {
    method: "POST",
    headers: session?.email ? { "x-user-email": session.email } : {},
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Gagal mengunggah thumbnail.");
  }

  const data = (await res.json()) as { url: string };
  return { data, source: "api" };
}

export async function createModule(
  courseId: string,
  input: ModuleFormInput
): Promise<ApiResult<AdminModuleInput>> {
  return request<AdminModuleInput>(`/courses/${courseId}/modules`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateModule(
  courseId: string,
  moduleId: string,
  input: Partial<ModuleFormInput>
): Promise<ApiResult<AdminModuleInput>> {
  return request<AdminModuleInput>(`/courses/${courseId}/modules/${moduleId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteModule(
  courseId: string,
  moduleId: string
): Promise<ApiResult<{ ok: boolean }>> {
  return request<{ ok: boolean }>(`/courses/${courseId}/modules/${moduleId}`, {
    method: "DELETE",
  });
}

export async function createLesson(
  courseId: string,
  moduleId: string,
  input: LessonFormInput
): Promise<ApiResult<AdminLessonInput>> {
  return request<AdminLessonInput>(`/courses/${courseId}/modules/${moduleId}/lessons`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateLesson(
  courseId: string,
  moduleId: string,
  lessonId: string,
  input: Partial<LessonFormInput>
): Promise<ApiResult<AdminLessonInput>> {
  return request<AdminLessonInput>(
    `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    }
  );
}

export async function deleteLesson(
  courseId: string,
  moduleId: string,
  lessonId: string
): Promise<ApiResult<{ ok: boolean }>> {
  return request<{ ok: boolean }>(
    `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
    { method: "DELETE" }
  );
}

export async function reorderCurriculum(
  courseId: string,
  input: CurriculumReorderInput
): Promise<ApiResult<AdminCourse>> {
  return request<AdminCourse>(`/courses/${courseId}/curriculum`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function fetchChatRooms(): Promise<ApiResult<AdminChatRoom[]>> {
  return request<AdminChatRoom[]>("/chat-rooms");
}

export async function createChatRoom(input: ChatRoomFormInput): Promise<ApiResult<AdminChatRoom>> {
  return request<AdminChatRoom>("/chat-rooms", { method: "POST", body: JSON.stringify(input) });
}

export async function updateChatRoom(
  id: string,
  input: Partial<AdminChatRoom>
): Promise<ApiResult<AdminChatRoom>> {
  return request<AdminChatRoom>(`/chat-rooms/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function fetchChatRoomMembers(
  roomId: string
): Promise<ApiResult<import("./types").AdminChatRoomMember[]>> {
  return request(`/chat-rooms/${roomId}/members`);
}

export async function fetchModerationQueue(): Promise<ApiResult<AdminModerationItem[]>> {
  return request<AdminModerationItem[]>("/moderation");
}

export async function resolveModeration(
  id: string,
  decision: ModerationDecision
): Promise<ApiResult<AdminModerationItem>> {
  return request<AdminModerationItem>(`/moderation/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ decision }),
  });
}

export async function fetchUsers(): Promise<ApiResult<AdminUser[]>> {
  return request<AdminUser[]>("/users");
}

export async function updateUserRole(
  id: string,
  role: AdminUser["role"]
): Promise<ApiResult<AdminUser>> {
  return request<AdminUser>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export type AdminChangeRequest = import("@/lib/mentor/change-requests").ChangeRequestDto;

export type AdminCollaborationChatRoom = {
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
};

export type AdminCollaborationChatList = {
  rooms: AdminCollaborationChatRoom[];
  currentUserId: string;
};

/** @deprecated Use AdminCollaborationChatRoom / AdminCollaborationChatList */
export type AdminCollaborationChat = AdminCollaborationChatRoom & {
  currentUserId?: string;
};

export async function fetchChangeRequests(
  status?: string
): Promise<ApiResult<AdminChangeRequest[]>> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return request<AdminChangeRequest[]>(`/change-requests${q}`);
}

export async function reviewChangeRequest(
  id: string,
  body: {
    decision: "approve" | "reject" | "approved" | "rejected" | "edited";
    adminNote?: string;
    editedData?: Record<string, unknown> | null;
  }
): Promise<ApiResult<AdminChangeRequest>> {
  return request<AdminChangeRequest>(`/change-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function fetchCollaborationChat(): Promise<
  ApiResult<AdminCollaborationChatList>
> {
  return request<AdminCollaborationChatList>("/collaboration-chat");
}

export type AdminBranchChangeRequest =
  import("@/lib/chat/branch-change-requests").ChatBranchChangeRequestDto;

export async function fetchBranchChangeRequests(
  status?: string
): Promise<ApiResult<AdminBranchChangeRequest[]>> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return request<AdminBranchChangeRequest[]>(`/branch-change-requests${q}`);
}

export async function reviewBranchChangeRequest(
  id: string,
  body: {
    decision: "approve" | "reject" | "approved" | "rejected" | "edited";
    adminNote?: string;
    editedData?: Record<string, unknown> | null;
  }
): Promise<ApiResult<AdminBranchChangeRequest>> {
  return request<AdminBranchChangeRequest>(`/branch-change-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function fetchPlaylists(): Promise<ApiResult<PlaylistSummary[]>> {
  return request<PlaylistSummary[]>("/playlists");
}

export async function fetchPlaylist(id: string): Promise<ApiResult<PlaylistDetail>> {
  return request<PlaylistDetail>(`/playlists/${id}`);
}

export async function createPlaylist(body: {
  title: string;
  description?: string;
  isPublished?: boolean;
}): Promise<ApiResult<PlaylistDetail>> {
  return request<PlaylistDetail>("/playlists", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updatePlaylist(
  id: string,
  body: { title?: string; description?: string | null; isPublished?: boolean }
): Promise<ApiResult<PlaylistDetail>> {
  return request<PlaylistDetail>(`/playlists/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deletePlaylist(id: string): Promise<ApiResult<{ ok: boolean }>> {
  return request<{ ok: boolean }>(`/playlists/${id}`, { method: "DELETE" });
}

export async function addPlaylistItems(
  id: string,
  body: { lessonId?: string; courseId?: string; moduleId?: string }
): Promise<ApiResult<PlaylistDetail>> {
  return request<PlaylistDetail>(`/playlists/${id}/items`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function removePlaylistItem(
  playlistId: string,
  itemId: string
): Promise<ApiResult<PlaylistDetail>> {
  return request<PlaylistDetail>(`/playlists/${playlistId}/items/${itemId}`, {
    method: "DELETE",
  });
}

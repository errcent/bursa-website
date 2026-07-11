import { courses, mentors } from "@/lib/mock-data";
import { calculateCheckoutBreakdown, PLATFORM_COMMISSION_RATE } from "@/lib/pricing";
import type {
  AdminChatRoom,
  AdminCourse,
  AdminMentor,
  AdminModerationItem,
  AdminRevenueLine,
  AdminRevenueReport,
  AdminStats,
  AdminUser,
} from "./types";

let mockMentors: AdminMentor[] = mentors.map((m, i) => ({
  id: `mentor-mock-${i}`,
  userId: `user-mock-${i}`,
  slug: m.slug,
  name: m.name,
  email: `${m.slug}@mentor.bursa.dev`,
  title: m.title,
  bio: m.bio,
  philosophy: m.philosophy,
  instruments: m.instruments,
  verified: m.verified,
  yearsExperience: m.yearsExperience,
  studentsCount: m.studentsCount,
  coursesCount: m.coursesCount,
  rating: m.rating,
  licenseLabel: m.licenseLabel,
  availableFor1on1: m.availableFor1on1,
  sessionPrice: m.sessionPrice,
}));

let mockCourses: AdminCourse[] = courses.map((c, i) => {
  const mentor = mentors.find((m) => m.slug === c.mentorSlug);
  return {
    id: `course-mock-${i}`,
    slug: c.slug,
    title: c.title,
    mentorId: `mentor-mock-${mentors.findIndex((m) => m.slug === c.mentorSlug)}`,
    mentorName: mentor?.name ?? "—",
    instrument: c.instrument,
    level: c.level,
    price: c.price,
    studentsCount: c.studentsCount,
    durationHours: c.durationHours,
    shortDescription: c.shortDescription,
    thumbnailUrl: c.thumbnailUrl,
    isPublished: true,
    modules: c.modules.map((mod, mi) => ({
      id: `mod-mock-${i}-${mi}`,
      title: mod.title,
      sortOrder: mi,
      lessons: mod.lessons.map((l, li) => ({
        id: `lesson-mock-${i}-${mi}-${li}`,
        title: l.title,
        description: null,
        durationMinutes: l.durationMinutes,
        isPreviewGratis: l.preview ?? false,
        videoUrl: l.preview ? `https://cdn.bursa.dev/preview/${c.slug}/${l.id}.mp4` : null,
        sortOrder: li,
      })),
    })),
  };
});

let mockChatRooms: AdminChatRoom[] = mentors.slice(0, 3).flatMap((m, mi) =>
  ["Pemula", "Menengah", "Mahir"].map((tier, ti) => ({
    id: `room-mock-${mi}-${ti}`,
    name: `Komunitas ${tier} — ${m.initials}`,
    slug: `${tier.toLowerCase()}-${m.slug}`,
    mentorId: `mentor-mock-${mi}`,
    mentorName: m.name,
    tier: tier as AdminChatRoom["tier"],
    isProtected: tier === "Mahir",
    screenshotProtection: tier !== "Pemula",
    isActive: true,
    memberCount: 24 + ti * 11,
    description: `Ruang diskusi ${tier.toLowerCase()} untuk komunitas ${m.name}.`,
  }))
);

let mockModeration: AdminModerationItem[] = [
  {
    id: "mod-mock-1",
    contentType: "chat_message",
    contentId: "msg-001",
    contentPreview: "Join grup VIP saya untuk sinyal pasti profit 500%!",
    reason: "Promosi tidak relevan / spam",
    status: "pending",
    reporterName: "Test Learner",
    reporterEmail: "learner@test.dev",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    history: [],
  },
  {
    id: "mod-mock-2",
    contentType: "review",
    contentId: "rev-002",
    contentPreview: "Kelas ini menjamin return 30% per bulan.",
    reason: "Klaim return tidak realistis",
    status: "pending",
    reporterName: "Dinda Ramadhani",
    reporterEmail: "demo@bursa.id",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    history: [],
  },
];

let mockUsers: AdminUser[] = [
  {
    id: "user-1",
    name: "Test Admin",
    email: "admin@test.dev",
    role: "admin",
    status: "active",
    enrollmentCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "user-2",
    name: "Test Learner",
    email: "learner@test.dev",
    role: "learner",
    status: "active",
    enrollmentCount: 2,
    createdAt: "2026-01-10T00:00:00.000Z",
  },
  {
    id: "user-3",
    name: "Andra Wicaksono, CFA",
    email: "andra-wicaksono@mentor.bursa.dev",
    role: "mentor",
    status: "active",
    enrollmentCount: 0,
    createdAt: "2026-01-05T00:00:00.000Z",
  },
  {
    id: "user-4",
    name: "Test Developer",
    email: "developer@test.dev",
    role: "developer",
    status: "active",
    enrollmentCount: 0,
    createdAt: "2026-01-08T00:00:00.000Z",
  },
];

export function getMockStats(): AdminStats {
  const report = getMockRevenueReport();
  return {
    totalUsers: mockUsers.length + 42,
    totalMentors: mockMentors.length,
    totalCourses: mockCourses.length,
    totalEnrollments: mockCourses.reduce((s, c) => s + c.studentsCount, 0),
    revenue: report.totals.platformFee,
    activeChatRooms: mockChatRooms.filter((r) => r.isActive).length,
    pendingModeration: mockModeration.filter((m) => m.status === "pending").length,
    recentActivity: [
      {
        id: "act-1",
        type: "enrollment",
        description: "Pengguna baru mendaftar kelas Fundamental Saham",
        actor: "learner@test.dev",
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: "act-2",
        type: "moderation",
        description: "Laporan konten baru masuk antrean moderasi",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "act-3",
        type: "mentor",
        description: "Mentor baru menunggu verifikasi",
        actor: "bimo-satrio@mentor.bursa.dev",
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };
}

export function getMockRevenueReport(): AdminRevenueReport {
  const commissionRatePercent = PLATFORM_COMMISSION_RATE * 100;
  const sampleBuyers = [
    { name: "Test Learner", email: "learner@test.dev" },
    { name: "Dinda Ramadhani", email: "demo@bursa.id" },
    { name: "Putri A.", email: "putri@test.dev" },
    { name: "Rian H.", email: "rian@test.dev" },
  ];

  const lines: AdminRevenueLine[] = mockCourses.slice(0, 4).flatMap((course, courseIndex) => {
    const count = Math.min(3, Math.max(1, Math.floor(course.studentsCount / 1500)));
    return Array.from({ length: count }, (_, i) => {
      const breakdown = calculateCheckoutBreakdown(course.price);
      const buyer = sampleBuyers[(courseIndex + i) % sampleBuyers.length];
      return {
        id: `mock-tx-${course.id}-${i}`,
        source: "transaction" as const,
        status: "COMPLETED" as const,
        courseId: course.id,
        courseTitle: course.title,
        mentorId: course.mentorId,
        mentorName: course.mentorName,
        buyerId: `buyer-mock-${courseIndex}-${i}`,
        buyerName: buyer.name,
        buyerEmail: buyer.email,
        coursePrice: breakdown.coursePrice,
        platformFee: breakdown.platformFee,
        mentorPayout: breakdown.mentorPayout,
        commissionRatePercent: breakdown.commissionRatePercent,
        createdAt: new Date(Date.now() - (courseIndex * 3 + i + 1) * 36 * 60 * 60 * 1000).toISOString(),
      };
    });
  });

  const mentorMap = new Map<string, AdminRevenueReport["byMentor"][number]>();
  const courseMap = new Map<string, AdminRevenueReport["byCourse"][number]>();
  let gross = 0;
  let platformFee = 0;
  let mentorPayout = 0;

  for (const line of lines) {
    gross += line.coursePrice;
    platformFee += line.platformFee;
    mentorPayout += line.mentorPayout;

    const mentor = mentorMap.get(line.mentorId) ?? {
      mentorId: line.mentorId,
      mentorName: line.mentorName,
      transactionCount: 0,
      gross: 0,
      platformFee: 0,
      mentorPayout: 0,
    };
    mentor.transactionCount += 1;
    mentor.gross += line.coursePrice;
    mentor.platformFee += line.platformFee;
    mentor.mentorPayout += line.mentorPayout;
    mentorMap.set(line.mentorId, mentor);

    const course = courseMap.get(line.courseId) ?? {
      courseId: line.courseId,
      courseTitle: line.courseTitle,
      mentorName: line.mentorName,
      transactionCount: 0,
      gross: 0,
      platformFee: 0,
      mentorPayout: 0,
    };
    course.transactionCount += 1;
    course.gross += line.coursePrice;
    course.platformFee += line.platformFee;
    course.mentorPayout += line.mentorPayout;
    courseMap.set(line.courseId, course);
  }

  return {
    commissionRatePercent,
    dataSource: "transaction",
    note: `Data demo. Komisi platform ${commissionRatePercent}% dari harga kelas.`,
    totals: {
      transactionCount: lines.length,
      gross,
      platformFee,
      mentorPayout,
    },
    lines,
    byMentor: [...mentorMap.values()].sort((a, b) => b.platformFee - a.platformFee),
    byCourse: [...courseMap.values()].sort((a, b) => b.platformFee - a.platformFee),
  };
}

export function getMockMentors() {
  return [...mockMentors];
}

export function createMockMentor(input: Omit<AdminMentor, "id" | "userId" | "slug" | "studentsCount" | "coursesCount" | "rating"> & { slug?: string }) {
  const slug = input.slug ?? input.name.toLowerCase().replace(/\s+/g, "-").slice(0, 40);
  const mentor: AdminMentor = {
    ...input,
    id: `mentor-mock-${Date.now()}`,
    userId: `user-mock-${Date.now()}`,
    slug,
    studentsCount: 0,
    coursesCount: 0,
    rating: 0,
  };
  mockMentors = [mentor, ...mockMentors];
  return mentor;
}

export function updateMockMentor(id: string, patch: Partial<AdminMentor>) {
  mockMentors = mockMentors.map((m) => (m.id === id ? { ...m, ...patch } : m));
  return mockMentors.find((m) => m.id === id);
}

export function deleteMockMentor(id: string) {
  mockMentors = mockMentors.filter((m) => m.id !== id);
}

export function getMockCourses() {
  return [...mockCourses];
}

export function createMockCourse(input: Omit<AdminCourse, "id" | "slug" | "mentorName" | "studentsCount"> & { slug?: string }) {
  const mentor = mockMentors.find((m) => m.id === input.mentorId);
  const slug = input.slug ?? input.title.toLowerCase().replace(/\s+/g, "-").slice(0, 50);
  const course: AdminCourse = {
    ...input,
    id: `course-mock-${Date.now()}`,
    slug,
    mentorName: mentor?.name ?? "—",
    studentsCount: 0,
  };
  mockCourses = [course, ...mockCourses];
  return course;
}

export function updateMockCourse(id: string, patch: Partial<AdminCourse>) {
  mockCourses = mockCourses.map((c) => (c.id === id ? { ...c, ...patch } : c));
  return mockCourses.find((c) => c.id === id);
}

export function deleteMockCourse(id: string) {
  mockCourses = mockCourses.filter((c) => c.id !== id);
}

export function getMockCourse(id: string) {
  return mockCourses.find((c) => c.id === id);
}

export function createMockModule(courseId: string, title: string) {
  const course = mockCourses.find((c) => c.id === courseId);
  if (!course) throw new Error("Course not found");
  const mod = {
    id: `mod-mock-${Date.now()}`,
    title,
    sortOrder: course.modules.length,
    lessons: [] as AdminCourse["modules"][number]["lessons"],
  };
  course.modules = [...course.modules, mod];
  return mod;
}

export function updateMockModule(
  courseId: string,
  moduleId: string,
  patch: { title?: string; sortOrder?: number }
) {
  const course = mockCourses.find((c) => c.id === courseId);
  if (!course) throw new Error("Course not found");
  course.modules = course.modules.map((m) =>
    m.id === moduleId ? { ...m, ...patch } : m
  );
  return course.modules.find((m) => m.id === moduleId);
}

export function deleteMockModule(courseId: string, moduleId: string) {
  const course = mockCourses.find((c) => c.id === courseId);
  if (!course) throw new Error("Course not found");
  course.modules = course.modules
    .filter((m) => m.id !== moduleId)
    .map((m, i) => ({ ...m, sortOrder: i }));
}

export function createMockLesson(
  courseId: string,
  moduleId: string,
  input: {
    title: string;
    description?: string | null;
    durationMinutes: number;
    isPreviewGratis?: boolean;
    videoUrl?: string | null;
  }
) {
  const course = mockCourses.find((c) => c.id === courseId);
  if (!course) throw new Error("Course not found");
  const mod = course.modules.find((m) => m.id === moduleId);
  if (!mod) throw new Error("Module not found");
  const lesson = {
    id: `lesson-mock-${Date.now()}`,
    title: input.title,
    description: input.description ?? null,
    durationMinutes: input.durationMinutes,
    isPreviewGratis: input.isPreviewGratis ?? false,
    videoUrl: input.videoUrl ?? null,
    sortOrder: mod.lessons.length,
  };
  mod.lessons = [...mod.lessons, lesson];
  return lesson;
}

export function updateMockLesson(
  courseId: string,
  moduleId: string,
  lessonId: string,
  patch: Partial<{
    title: string;
    description: string | null;
    durationMinutes: number;
    isPreviewGratis: boolean;
    videoUrl: string | null;
    sortOrder: number;
    moduleId: string;
  }>
) {
  const course = mockCourses.find((c) => c.id === courseId);
  if (!course) throw new Error("Course not found");
  const source = course.modules.find((m) => m.id === moduleId);
  if (!source) throw new Error("Module not found");
  const lesson = source.lessons.find((l) => l.id === lessonId);
  if (!lesson) throw new Error("Lesson not found");

  const targetModuleId = patch.moduleId ?? moduleId;
  const nextLesson = {
    ...lesson,
    title: patch.title ?? lesson.title,
    description: patch.description === undefined ? lesson.description : patch.description,
    durationMinutes: patch.durationMinutes ?? lesson.durationMinutes,
    isPreviewGratis: patch.isPreviewGratis ?? lesson.isPreviewGratis,
    videoUrl: patch.videoUrl === undefined ? lesson.videoUrl : patch.videoUrl,
    sortOrder: patch.sortOrder ?? lesson.sortOrder,
  };

  if (targetModuleId !== moduleId) {
    source.lessons = source.lessons
      .filter((l) => l.id !== lessonId)
      .map((l, i) => ({ ...l, sortOrder: i }));
    const target = course.modules.find((m) => m.id === targetModuleId);
    if (!target) throw new Error("Target module not found");
    const moved = {
      ...nextLesson,
      sortOrder: patch.sortOrder ?? target.lessons.length,
    };
    target.lessons = [...target.lessons, moved];
    return moved;
  }

  source.lessons = source.lessons.map((l) => (l.id === lessonId ? nextLesson : l));
  return nextLesson;
}

export function deleteMockLesson(courseId: string, moduleId: string, lessonId: string) {
  const course = mockCourses.find((c) => c.id === courseId);
  if (!course) throw new Error("Course not found");
  const mod = course.modules.find((m) => m.id === moduleId);
  if (!mod) throw new Error("Module not found");
  mod.lessons = mod.lessons
    .filter((l) => l.id !== lessonId)
    .map((l, i) => ({ ...l, sortOrder: i }));
}

export function reorderMockCurriculum(
  courseId: string,
  modules: Array<{
    id: string;
    sortOrder: number;
    lessons?: Array<{ id: string; sortOrder: number }>;
  }>
) {
  const course = mockCourses.find((c) => c.id === courseId);
  if (!course) throw new Error("Course not found");

  const byId = new Map(course.modules.map((m) => [m.id!, m]));
  course.modules = modules
    .map((entry) => {
      const mod = byId.get(entry.id);
      if (!mod) return null;
      const lessonById = new Map(mod.lessons.map((l) => [l.id!, l]));
      const lessons = entry.lessons
        ? entry.lessons
            .map((l) => {
              const lesson = lessonById.get(l.id);
              return lesson ? { ...lesson, sortOrder: l.sortOrder } : null;
            })
            .filter(Boolean)
            .sort((a, b) => (a!.sortOrder ?? 0) - (b!.sortOrder ?? 0))
        : mod.lessons;
      return { ...mod, sortOrder: entry.sortOrder, lessons: lessons as typeof mod.lessons };
    })
    .filter(Boolean)
    .sort((a, b) => (a!.sortOrder ?? 0) - (b!.sortOrder ?? 0)) as AdminCourse["modules"];

  return course;
}

export function getMockChatRooms() {
  return [...mockChatRooms];
}

export function createMockChatRoom(input: Omit<AdminChatRoom, "id" | "slug" | "mentorName" | "memberCount" | "isActive">) {
  const mentor = mockMentors.find((m) => m.id === input.mentorId);
  const room: AdminChatRoom = {
    ...input,
    id: `room-mock-${Date.now()}`,
    slug: input.name.toLowerCase().replace(/\s+/g, "-"),
    mentorName: mentor?.name ?? "—",
    memberCount: 0,
    isActive: true,
  };
  mockChatRooms = [room, ...mockChatRooms];
  return room;
}

export function updateMockChatRoom(id: string, patch: Partial<AdminChatRoom>) {
  mockChatRooms = mockChatRooms.map((r) => (r.id === id ? { ...r, ...patch } : r));
  return mockChatRooms.find((r) => r.id === id);
}

export function getMockModeration() {
  return [...mockModeration];
}

export function resolveMockModeration(id: string, decision: "approved" | "rejected", actor = "Admin") {
  mockModeration = mockModeration.map((item) =>
    item.id === id
      ? {
          ...item,
          status: decision,
          reviewedAt: new Date().toISOString(),
          history: [
            ...item.history,
            {
              id: `hist-${Date.now()}`,
              action: decision === "approved" ? "Disetujui" : "Ditolak",
              actor,
              createdAt: new Date().toISOString(),
            },
          ],
        }
      : item
  );
  return mockModeration.find((m) => m.id === id);
}

export function getMockUsers() {
  return [...mockUsers];
}

export function updateMockUserRole(id: string, role: AdminUser["role"]) {
  mockUsers = mockUsers.map((u) => (u.id === id ? { ...u, role } : u));
  return mockUsers.find((u) => u.id === id);
}

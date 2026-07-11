import type { Instrument, Level } from "@/lib/types";

export type AdminUserRole = "learner" | "mentor" | "admin" | "developer";
export type AdminUserStatus = "active" | "suspended";
export type ModerationDecision = "approved" | "rejected";
export type ChatRoomTierLabel = "Pemula" | "Menengah" | "Mahir" | "Internal";

export interface AdminActivity {
  id: string;
  type: string;
  description: string;
  actor?: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalMentors: number;
  totalCourses: number;
  totalEnrollments: number;
  /** Pendapatan platform (komisi), bukan gross penjualan. */
  revenue: number;
  activeChatRooms: number;
  pendingModeration: number;
  recentActivity: AdminActivity[];
}

export type AdminRevenueLineStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "ESTIMATED";

export type AdminRevenueLineSource = "transaction" | "enrollment_estimate";

export interface AdminRevenueLine {
  id: string;
  source: AdminRevenueLineSource;
  status: AdminRevenueLineStatus;
  courseId: string;
  courseTitle: string;
  mentorId: string;
  mentorName: string;
  buyerId: string | null;
  buyerName: string | null;
  buyerEmail: string | null;
  coursePrice: number;
  platformFee: number;
  mentorPayout: number;
  commissionRatePercent: number;
  createdAt: string;
}

export interface AdminRevenueByMentor {
  mentorId: string;
  mentorName: string;
  transactionCount: number;
  gross: number;
  platformFee: number;
  mentorPayout: number;
}

export interface AdminRevenueByCourse {
  courseId: string;
  courseTitle: string;
  mentorName: string;
  transactionCount: number;
  gross: number;
  platformFee: number;
  mentorPayout: number;
}

export interface AdminRevenueReport {
  commissionRatePercent: number;
  dataSource: "transaction" | "enrollment_estimate";
  note: string;
  totals: {
    transactionCount: number;
    gross: number;
    platformFee: number;
    mentorPayout: number;
  };
  lines: AdminRevenueLine[];
  byMentor: AdminRevenueByMentor[];
  byCourse: AdminRevenueByCourse[];
}

export interface AdminMentor {
  id: string;
  userId: string;
  slug: string;
  name: string;
  email: string;
  title: string;
  bio: string;
  philosophy: string;
  instruments: Instrument[];
  verified: boolean;
  yearsExperience: number;
  studentsCount: number;
  coursesCount: number;
  rating: number;
  licenseLabel?: string;
  availableFor1on1: boolean;
  sessionPrice?: string;
}

export interface AdminLessonInput {
  id?: string;
  title: string;
  description?: string | null;
  durationMinutes: number;
  isPreviewGratis?: boolean;
  videoUrl?: string | null;
  sortOrder?: number;
}

export interface AdminModuleInput {
  id?: string;
  title: string;
  sortOrder?: number;
  lessons: AdminLessonInput[];
}

export interface ModuleFormInput {
  title: string;
  sortOrder?: number;
}

export interface LessonFormInput {
  title: string;
  description?: string | null;
  durationMinutes: number;
  isPreviewGratis?: boolean;
  videoUrl?: string | null;
  sortOrder?: number;
  moduleId?: string;
}

export interface CurriculumReorderInput {
  modules: Array<{
    id: string;
    sortOrder: number;
    lessons?: Array<{ id: string; sortOrder: number }>;
  }>;
}

export interface AdminCourse {
  id: string;
  slug: string;
  title: string;
  mentorId: string;
  mentorName: string;
  instrument: Instrument;
  level: Level;
  price: number;
  studentsCount: number;
  durationHours: number;
  shortDescription: string;
  thumbnailUrl?: string | null;
  isPublished: boolean;
  modules: AdminModuleInput[];
}

export interface AdminChatRoomMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

export interface AdminChatRoom {
  id: string;
  name: string;
  slug: string;
  mentorId: string;
  mentorName: string;
  tier: ChatRoomTierLabel;
  roomKind?: "public" | "mentor_community" | "mentor_internal";
  isProtected: boolean;
  screenshotProtection: boolean;
  isActive: boolean;
  memberCount: number;
  description?: string;
  branchCount?: number;
}

export interface ModerationActionHistory {
  id: string;
  action: string;
  actor: string;
  createdAt: string;
}

export interface AdminModerationItem {
  id: string;
  contentType: string;
  contentId: string;
  contentPreview: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reporterName?: string;
  reporterEmail?: string;
  createdAt: string;
  reviewedAt?: string;
  history: ModerationActionHistory[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  enrollmentCount: number;
  createdAt: string;
}

export interface MentorFormInput {
  name: string;
  email: string;
  title: string;
  bio: string;
  philosophy: string;
  instruments: Instrument[];
  yearsExperience: number;
  licenseLabel?: string;
  verified: boolean;
  availableFor1on1: boolean;
  sessionPrice?: string;
}

export interface AvailabilitySlotInput {
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface AdminAvailabilitySlot {
  id: string;
  mentorId: string;
  startAt: string;
  endAt: string;
  isBooked: boolean;
  bookedByUserId?: string | null;
  bookedByName?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface MentorSessionConfig {
  id: string;
  slug: string;
  availableFor1on1: boolean;
  sessionPrice: string | null;
}

export interface CourseFormInput {
  title: string;
  shortDescription: string;
  price: number;
  level: Level;
  instrument: Instrument;
  mentorId: string;
  durationHours: number;
  isPublished: boolean;
  thumbnailUrl?: string | null;
  modules: AdminModuleInput[];
}

export interface ChatRoomFormInput {
  name: string;
  mentorId: string;
  tier: ChatRoomTierLabel;
  roomKind?: "public" | "mentor_community" | "mentor_internal";
  screenshotProtection: boolean;
  isProtected: boolean;
  description?: string;
}

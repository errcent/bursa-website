export type PlaylistSummary = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  itemCount: number;
  totalMinutes: number;
  mentorCount: number;
  isPublished?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PlaylistItemAccessStatus = "owned" | "free" | "locked";

export type PlaylistItemView = {
  id: string;
  sortOrder: number;
  lessonId: string | null;
  courseId: string | null;
  lessonTitle: string | null;
  lessonLegacyId: string | null;
  courseSlug: string | null;
  courseTitle: string | null;
  mentorName: string | null;
  mentorSlug: string | null;
  durationMinutes: number | null;
  videoThumbnailUrl?: string | null;
  /** Resolved per viewer: enrolled, free preview, or locked. */
  accessStatus?: PlaylistItemAccessStatus;
};

export type PlaylistDetail = PlaylistSummary & {
  items: PlaylistItemView[];
  /** `${courseSlug}/${lessonLegacyId}` completed for signed-in viewer (incl. shared video). */
  completedLessonKeys?: string[];
};

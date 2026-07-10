export type PlaylistSummary = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  itemCount: number;
  totalMinutes: number;
  mentorCount: number;
  createdAt: string;
  updatedAt: string;
};

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
};

export type PlaylistDetail = PlaylistSummary & {
  items: PlaylistItemView[];
};

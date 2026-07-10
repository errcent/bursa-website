import { slugify } from "@/lib/admin/server";
import { db } from "@/lib/db";
import type { PlaylistDetail, PlaylistItemView, PlaylistSummary } from "@/lib/playlist/types";

type PlaylistWithItems = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    sortOrder: number;
    lessonId: string | null;
    courseId: string | null;
    lesson: {
      id: string;
      legacyId: string | null;
      title: string;
      durationMinutes: number;
      module: {
        course: {
          id: string;
          slug: string;
          title: string;
          mentor: { slug: string; user: { nama: string } };
        };
      };
    } | null;
    course: {
      id: string;
      slug: string;
      title: string;
      durationHours: number;
      mentor: { slug: string; user: { nama: string } };
    } | null;
  }>;
};

const playlistInclude = {
  items: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      lesson: {
        include: {
          module: {
            include: {
              course: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  mentor: { select: { slug: true, user: { select: { nama: true } } } },
                },
              },
            },
          },
        },
      },
      course: {
        include: {
          mentor: { select: { slug: true, user: { select: { nama: true } } } },
        },
      },
    },
  },
} as const;

function serializeItem(item: PlaylistWithItems["items"][number]): PlaylistItemView {
  if (item.lesson) {
    const course = item.lesson.module.course;
    return {
      id: item.id,
      sortOrder: item.sortOrder,
      lessonId: item.lesson.id,
      courseId: item.lesson.module.course.id,
      lessonTitle: item.lesson.title,
      lessonLegacyId: item.lesson.legacyId,
      courseSlug: course.slug,
      courseTitle: course.title,
      mentorName: course.mentor.user.nama,
      mentorSlug: course.mentor.slug,
      durationMinutes: item.lesson.durationMinutes,
    };
  }

  if (item.course) {
    return {
      id: item.id,
      sortOrder: item.sortOrder,
      lessonId: null,
      courseId: item.course.id,
      lessonTitle: null,
      lessonLegacyId: null,
      courseSlug: item.course.slug,
      courseTitle: item.course.title,
      mentorName: item.course.mentor.user.nama,
      mentorSlug: item.course.mentor.slug,
      durationMinutes: item.course.durationHours * 60,
    };
  }

  return {
    id: item.id,
    sortOrder: item.sortOrder,
    lessonId: item.lessonId,
    courseId: item.courseId,
    lessonTitle: null,
    lessonLegacyId: null,
    courseSlug: null,
    courseTitle: null,
    mentorName: null,
    mentorSlug: null,
    durationMinutes: null,
  };
}

function summarizePlaylist(playlist: PlaylistWithItems): PlaylistSummary {
  const mentors = new Set<string>();
  let totalMinutes = 0;

  for (const item of playlist.items) {
    if (item.lesson) {
      totalMinutes += item.lesson.durationMinutes;
      mentors.add(item.lesson.module.course.mentor.slug);
    } else if (item.course) {
      totalMinutes += item.course.durationHours * 60;
      mentors.add(item.course.mentor.slug);
    }
  }

  return {
    id: playlist.id,
    title: playlist.title,
    description: playlist.description,
    slug: playlist.slug,
    itemCount: playlist.items.length,
    totalMinutes,
    mentorCount: mentors.size,
    createdAt: playlist.createdAt.toISOString(),
    updatedAt: playlist.updatedAt.toISOString(),
  };
}

export function serializePlaylistSummary(playlist: PlaylistWithItems): PlaylistSummary {
  return summarizePlaylist(playlist);
}

export function serializePlaylistDetail(playlist: PlaylistWithItems): PlaylistDetail {
  return {
    ...summarizePlaylist(playlist),
    items: playlist.items.map(serializeItem),
  };
}

export async function resolveUniquePlaylistSlug(userId: string, title: string, preferred?: string) {
  const base = slugify(preferred?.trim() || title) || "playlist";
  let candidate = base;
  let suffix = 2;

  while (
    await db.playlist.findUnique({
      where: { userId_slug: { userId, slug: candidate } },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function findUserPlaylistBySlug(userId: string, slug: string) {
  return db.playlist.findUnique({
    where: { userId_slug: { userId, slug } },
    include: playlistInclude,
  });
}

export async function listUserPlaylists(userId: string) {
  return db.playlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: playlistInclude,
  });
}

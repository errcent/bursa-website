import { NextResponse } from "next/server";

import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { db } from "@/lib/db";
import { DEMO_VIDEO_URL } from "@/lib/video/demo";
import { generatePlaybackToken } from "@/lib/video/protection";

async function getLessonContext(courseSlug: string, lessonId: string) {
  return db.lesson.findFirst({
    where: {
      OR: [{ id: lessonId }, { legacyId: lessonId }],
      module: { course: { slug: courseSlug } },
    },
    select: {
      id: true,
      videoUrl: true,
      isPreviewGratis: true,
      sortOrder: true,
      module: {
        select: {
          sortOrder: true,
          course: { select: { id: true, slug: true } },
        },
      },
    },
  });
}

async function hasDbEnrollment(userId: string, courseId: string): Promise<boolean> {
  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId },
    },
    select: { id: true },
  });
  return Boolean(enrollment);
}

function isServerFreePreview(lesson: {
  isPreviewGratis: boolean;
  sortOrder: number;
  module: { sortOrder: number };
}): boolean {
  if (lesson.isPreviewGratis) return true;
  return lesson.module.sortOrder === 0 && lesson.sortOrder === 0;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      courseId?: string;
      lessonId?: string;
    };

    const { courseId, lessonId } = body;

    if (!courseId || !lessonId) {
      return NextResponse.json(
        { error: "courseId dan lessonId wajib diisi." },
        { status: 400 }
      );
    }

    const lesson = await getLessonContext(courseId, lessonId);
    if (!lesson) {
      return NextResponse.json({ error: "Lesson tidak ditemukan." }, { status: 404 });
    }

    const previewMode = isServerFreePreview(lesson);

    let viewerId: string | null = null;
    if (!previewMode) {
      const user = await resolveAuthenticatedUser(request, {
        createIfMissing: false,
        claimedUserId: body.userId,
      });
      if (!user) {
        return NextResponse.json(
          { error: "Masuk diperlukan untuk mengakses konten berbayar." },
          { status: 401 }
        );
      }

      const enrolled = await hasDbEnrollment(user.id, lesson.module.course.id);
      if (!enrolled) {
        return NextResponse.json(
          { error: "Anda belum terdaftar di kelas ini." },
          { status: 403 }
        );
      }

      viewerId = user.id;
    }

    const tokenPayload = viewerId
      ? generatePlaybackToken(viewerId, lessonId)
      : {
          token: generatePlaybackToken("guest", lessonId).token,
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          lessonId,
          userId: "guest",
        };

    return NextResponse.json({
      ...tokenPayload,
      videoUrl: lesson.videoUrl ?? DEMO_VIDEO_URL,
      isPreview: previewMode,
      courseId,
    });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

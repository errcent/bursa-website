import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { resolveRequestUser } from "@/lib/lesson-qa/server";
import { getCourseBySlug } from "@/lib/mock-data";
import { DEMO_VIDEO_URL } from "@/lib/video/demo";
import { findLessonInCourse, isLessonFreePreview } from "@/lib/video/lesson-access";
import {
  canAccessVideo,
  generatePlaybackToken,
  isPreviewLesson,
} from "@/lib/video/protection";

async function hasDbEnrollment(
  userId: string,
  courseSlug: string,
  email?: string
): Promise<boolean> {
  const user = await resolveRequestUser({ userId, email }, { createIfMissing: false });
  if (!user) return false;

  const course = await db.course.findUnique({
    where: { slug: courseSlug },
    select: { id: true },
  });
  if (!course) return false;

  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: { userId: user.id, courseId: course.id },
    },
    select: { id: true },
  });
  return Boolean(enrollment);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      email?: string;
      courseId?: string;
      lessonId?: string;
      isPreview?: boolean;
    };

    const { userId, email, courseId, lessonId, isPreview } = body;

    if (!courseId || !lessonId) {
      return NextResponse.json(
        { error: "courseId dan lessonId wajib diisi." },
        { status: 400 }
      );
    }

    const course = getCourseBySlug(courseId);
    if (!course) {
      return NextResponse.json({ error: "Kelas tidak ditemukan." }, { status: 404 });
    }

    const lesson = course.modules
      .flatMap((m) => m.lessons)
      .find((l) => l.id === lessonId);

    if (!lesson) {
      return NextResponse.json({ error: "Lesson tidak ditemukan." }, { status: 404 });
    }

    const lessonContext = findLessonInCourse(course, lessonId);
    const freePreview = lessonContext
      ? isLessonFreePreview(lesson, lessonContext.moduleIndex, lessonContext.lessonIndex)
      : isPreviewLesson(lesson);

    // Explicit client flag wins; otherwise treat free-preview lessons as preview.
    const previewMode = isPreview ?? freePreview;

    if (!previewMode && !userId) {
      return NextResponse.json(
        { error: "Masuk diperlukan untuk mengakses konten berbayar." },
        { status: 401 }
      );
    }

    if (!previewMode && userId) {
      const localAccess = canAccessVideo(userId, courseId, lesson);
      const dbEnrolled = localAccess
        ? true
        : await hasDbEnrollment(userId, courseId, email);

      if (!localAccess && !dbEnrolled) {
        return NextResponse.json(
          { error: "Anda belum terdaftar di kelas ini." },
          { status: 403 }
        );
      }
    }

    const tokenPayload = userId
      ? generatePlaybackToken(userId, lessonId)
      : {
          token: generatePlaybackToken("guest", lessonId).token,
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          lessonId,
          userId: "guest",
        };

    return NextResponse.json({
      ...tokenPayload,
      videoUrl: DEMO_VIDEO_URL,
      isPreview: previewMode,
      courseId,
    });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

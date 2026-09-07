import { NextResponse } from "next/server";

import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { db } from "@/lib/db";
import { hasAllAccess, startCourseEnrollment } from "@/lib/subscription/access";
import { resolveSignedPlaybackUrl } from "@/lib/video/bunny";
import { issuePlaybackHeartbeatToken } from "@/lib/video/playback-heartbeat";
import { generatePlaybackToken } from "@/lib/video/protection";

function resolveLessonVideoUrl(stored: string | null | undefined): string {
  const signed = resolveSignedPlaybackUrl(stored);
  if (signed?.url) return signed.url;

  const trimmed = stored?.trim();
  if (trimmed && !trimmed.startsWith("bunny:")) return trimmed;

  return "";
}

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
          { error: "Masuk diperlukan untuk menonton pelajaran ini." },
          { status: 401 }
        );
      }

      const allAccess = await hasAllAccess(user.id);
      if (!allAccess) {
        return NextResponse.json(
          { error: "Akses katalog memerlukan akun yang aktif." },
          { status: 403 }
        );
      }

      await startCourseEnrollment(user.id, lesson.module.course.id);
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

    const heartbeat = viewerId
      ? issuePlaybackHeartbeatToken(viewerId, lessonId)
      : null;

    return NextResponse.json({
      ...tokenPayload,
      ...(heartbeat ?? {}),
      videoUrl: resolveLessonVideoUrl(lesson.videoUrl),
      isPreview: previewMode,
      courseId,
    });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

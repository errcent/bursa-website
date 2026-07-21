import { NextResponse } from "next/server";

import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { db } from "@/lib/db";
import { getEnrollmentAccess } from "@/lib/enrollment/access";
import {
  WATCH_COMPLETION_RATIO,
  computeHeartbeatCredit,
  verifyPlaybackHeartbeatToken,
} from "@/lib/video/playback-heartbeat";

/**
 * Accumulate server-verified watch time for a lesson (QC-20260719-46). The client pings this
 * while the video plays; the server credits real elapsed playback (clamped) so completion can
 * only be granted once verified watch time crosses the threshold — never on a forged number.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    userId?: string;
    token?: string;
    lessonId?: string;
    position?: number;
  };

  const { token, lessonId } = body;
  if (!token || !lessonId) {
    return NextResponse.json(
      { error: "token dan lessonId wajib diisi." },
      { status: 400 }
    );
  }

  const user = await resolveAuthenticatedUser(request, {
    createIfMissing: false,
    claimedUserId: body.userId,
  });
  if (!user) {
    return NextResponse.json({ error: "Autentikasi diperlukan." }, { status: 401 });
  }

  const payload = verifyPlaybackHeartbeatToken(token);
  if (!payload || payload.userId !== user.id || payload.lessonId !== lessonId) {
    return NextResponse.json({ error: "Token playback tidak valid." }, { status: 401 });
  }

  const lesson = await db.lesson.findFirst({
    where: { OR: [{ id: lessonId }, { legacyId: lessonId }] },
    select: {
      id: true,
      durationMinutes: true,
      module: { select: { course: { select: { id: true } } } },
    },
  });
  if (!lesson) {
    return NextResponse.json({ error: "Lesson tidak ditemukan." }, { status: 404 });
  }

  // Only enrolled learners accrue verified watch time (mirrors progress gating).
  const access = await getEnrollmentAccess(user.id, lesson.module.course.id);
  if (!access.enrolled) {
    return NextResponse.json(
      { error: "Kamu belum terdaftar di kelas ini." },
      { status: 403 }
    );
  }

  const durationSeconds = Math.max(0, lesson.durationMinutes * 60);
  const now = new Date();

  const existing = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    select: {
      verifiedWatchedSeconds: true,
      heartbeatPosition: true,
      lastHeartbeatAt: true,
    },
  });

  const credit = computeHeartbeatCredit({
    previousVerified: existing?.verifiedWatchedSeconds ?? 0,
    previousPosition: existing?.heartbeatPosition ?? 0,
    lastHeartbeatAt: existing?.lastHeartbeatAt ?? null,
    position: typeof body.position === "number" ? body.position : 0,
    durationSeconds,
    now,
  });

  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    create: {
      userId: user.id,
      lessonId: lesson.id,
      verifiedWatchedSeconds: credit.verifiedWatchedSeconds,
      heartbeatPosition: credit.heartbeatPosition,
      lastHeartbeatAt: now,
    },
    update: {
      verifiedWatchedSeconds: credit.verifiedWatchedSeconds,
      heartbeatPosition: credit.heartbeatPosition,
      lastHeartbeatAt: now,
    },
  });

  const threshold =
    durationSeconds === 0 ? 0 : Math.floor(durationSeconds * WATCH_COMPLETION_RATIO);

  return NextResponse.json({
    verifiedWatchedSeconds: credit.verifiedWatchedSeconds,
    thresholdSeconds: threshold,
    completionEligible:
      durationSeconds === 0 || credit.verifiedWatchedSeconds >= threshold,
  });
}

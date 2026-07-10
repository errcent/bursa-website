import {
  ChangeRequestAction,
  ChangeRequestStatus,
  ChangeRequestTargetType,
  type Prisma,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  captureSnapshot,
  changeRequestInclude,
  mapChangeRequest,
} from "@/lib/mentor/change-requests";
import { requireMentor, unauthorizedMentor } from "@/lib/mentor/server";

export async function GET(request: Request) {
  const mentor = await requireMentor(request);
  if (!mentor) return unauthorizedMentor();

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    let status: ChangeRequestStatus | undefined;
    if (statusParam === "pending") status = ChangeRequestStatus.PENDING;
    if (statusParam === "approved") status = ChangeRequestStatus.APPROVED;
    if (statusParam === "rejected") status = ChangeRequestStatus.REJECTED;

    const items = await db.courseChangeRequest.findMany({
      where: {
        mentorUserId: mentor.id,
        ...(status ? { status } : {}),
      },
      include: changeRequestInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items.map(mapChangeRequest));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat pengajuan." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const mentor = await requireMentor(request);
  if (!mentor) return unauthorizedMentor();

  try {
    const body = (await request.json()) as {
      courseId?: string;
      targetType?: string;
      action?: string;
      moduleId?: string | null;
      lessonId?: string | null;
      summary?: string;
      proposedData?: Record<string, unknown> | null;
    };

    const targetType = body.targetType as ChangeRequestTargetType | undefined;
    const action = body.action as ChangeRequestAction | undefined;

    if (
      !body.courseId ||
      !body.summary?.trim() ||
      !targetType ||
      !action ||
      !Object.values(ChangeRequestTargetType).includes(targetType) ||
      !Object.values(ChangeRequestAction).includes(action)
    ) {
      return NextResponse.json(
        { error: "Data usulan tidak lengkap atau tidak valid." },
        { status: 400 }
      );
    }

    const course = await db.course.findFirst({
      where: {
        id: body.courseId,
        mentorId: mentor.mentorProfile!.id,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Kelas tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    if (action === ChangeRequestAction.CREATE && targetType === ChangeRequestTargetType.COURSE) {
      return NextResponse.json(
        { error: "Pembuatan kelas baru hanya melalui admin." },
        { status: 400 }
      );
    }

    let moduleId = body.moduleId ?? null;
    let lessonId = body.lessonId ?? null;

    if (
      targetType === ChangeRequestTargetType.LESSON &&
      action === ChangeRequestAction.CREATE &&
      !moduleId
    ) {
      return NextResponse.json(
        { error: "moduleId wajib saat membuat pelajaran baru." },
        { status: 400 }
      );
    }

    if (
      targetType === ChangeRequestTargetType.MODULE &&
      action !== ChangeRequestAction.CREATE &&
      !moduleId
    ) {
      return NextResponse.json({ error: "moduleId wajib untuk target modul." }, { status: 400 });
    }

    if (
      targetType === ChangeRequestTargetType.LESSON &&
      action !== ChangeRequestAction.CREATE &&
      !lessonId
    ) {
      return NextResponse.json({ error: "lessonId wajib untuk target pelajaran." }, { status: 400 });
    }

    if (moduleId) {
      const ownedModule = await db.module.findFirst({
        where: { id: moduleId, courseId: course.id },
      });
      if (!ownedModule) {
        return NextResponse.json(
          { error: "Modul tidak ditemukan pada kelas ini." },
          { status: 404 }
        );
      }
    }

    if (lessonId) {
      const ownedLesson = await db.lesson.findFirst({
        where: {
          id: lessonId,
          module: { courseId: course.id },
        },
      });
      if (!ownedLesson) {
        return NextResponse.json(
          { error: "Pelajaran tidak ditemukan pada kelas ini." },
          { status: 404 }
        );
      }
      // Keep parent module consistent with the selected lesson.
      moduleId = ownedLesson.moduleId;
    }

    if (action !== ChangeRequestAction.DELETE) {
      const proposed = body.proposedData;
      if (!proposed || typeof proposed !== "object" || Array.isArray(proposed)) {
        return NextResponse.json(
          { error: "proposedData wajib untuk CREATE/UPDATE." },
          { status: 400 }
        );
      }
    }

    if (
      action === ChangeRequestAction.UPDATE &&
      targetType === ChangeRequestTargetType.LESSON &&
      body.proposedData &&
      typeof body.proposedData === "object" &&
      !Array.isArray(body.proposedData) &&
      typeof (body.proposedData as Record<string, unknown>).moduleId === "string"
    ) {
      const moveTo = (body.proposedData as Record<string, unknown>).moduleId as string;
      const targetModule = await db.module.findFirst({
        where: { id: moveTo, courseId: course.id },
      });
      if (!targetModule) {
        return NextResponse.json(
          { error: "Modul tujuan tidak ditemukan pada kelas ini." },
          { status: 404 }
        );
      }
    }

    const currentSnapshot =
      action === ChangeRequestAction.CREATE
        ? null
        : await captureSnapshot({
            targetType,
            courseId: course.id,
            moduleId,
            lessonId,
          });

    if (action !== ChangeRequestAction.CREATE && currentSnapshot === null) {
      return NextResponse.json({ error: "Target perubahan tidak ditemukan." }, { status: 404 });
    }

    const item = await db.courseChangeRequest.create({
      data: {
        courseId: course.id,
        mentorUserId: mentor.id,
        targetType,
        action,
        moduleId,
        lessonId,
        summary: body.summary.trim(),
        currentSnapshot: currentSnapshot ?? undefined,
        proposedData:
          action === ChangeRequestAction.DELETE ||
          body.proposedData === undefined ||
          body.proposedData === null
            ? undefined
            : (body.proposedData as Prisma.InputJsonValue),
        status: ChangeRequestStatus.PENDING,
      },
      include: changeRequestInclude,
    });

    return NextResponse.json(mapChangeRequest(item), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengirim pengajuan." }, { status: 500 });
  }
}

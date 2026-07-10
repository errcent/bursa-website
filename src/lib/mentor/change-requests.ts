import {
  ChangeRequestAction,
  ChangeRequestStatus,
  ChangeRequestTargetType,
  type CourseChangeRequest,
  type Prisma,
} from "@prisma/client";

import { db } from "@/lib/db";

export type ProposedCourseData = {
  title?: string;
  shortDescription?: string;
  durationHours?: number;
};

export type ProposedModuleData = {
  title?: string;
  sortOrder?: number;
};

export type ProposedLessonData = {
  title?: string;
  description?: string | null;
  durationMinutes?: number;
  isPreviewGratis?: boolean;
  videoUrl?: string | null;
  sortOrder?: number;
  moduleId?: string;
};

export type ChangeRequestDto = {
  id: string;
  courseId: string;
  courseTitle: string;
  mentorUserId: string;
  mentorName: string;
  mentorEmail: string;
  targetType: "COURSE" | "MODULE" | "LESSON";
  action: "CREATE" | "UPDATE" | "DELETE";
  moduleId: string | null;
  lessonId: string | null;
  summary: string;
  currentSnapshot: unknown;
  proposedData: unknown;
  appliedData: unknown;
  status: "pending" | "approved" | "rejected" | "edited";
  adminNote: string | null;
  reviewedById: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type RequestWithRelations = Prisma.CourseChangeRequestGetPayload<{
  include: {
    course: true;
    mentorUser: true;
    reviewer: true;
  };
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function optionalTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalNullableString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || null;
}

function optionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  return undefined;
}

export function statusToUi(status: ChangeRequestStatus): ChangeRequestDto["status"] {
  if (status === ChangeRequestStatus.PENDING) return "pending";
  if (status === ChangeRequestStatus.APPROVED) return "approved";
  if (status === ChangeRequestStatus.EDITED) return "edited";
  return "rejected";
}

export function mapChangeRequest(row: RequestWithRelations): ChangeRequestDto {
  return {
    id: row.id,
    courseId: row.courseId,
    courseTitle: row.course.title,
    mentorUserId: row.mentorUserId,
    mentorName: row.mentorUser.nama,
    mentorEmail: row.mentorUser.email,
    targetType: row.targetType,
    action: row.action,
    moduleId: row.moduleId,
    lessonId: row.lessonId,
    summary: row.summary,
    currentSnapshot: row.currentSnapshot,
    proposedData: row.proposedData,
    appliedData: row.appliedData,
    status: statusToUi(row.status),
    adminNote: row.adminNote,
    reviewedById: row.reviewedById,
    reviewerName: row.reviewer?.nama ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const changeRequestInclude = {
  course: true,
  mentorUser: true,
  reviewer: true,
} as const;

export async function captureSnapshot(input: {
  targetType: ChangeRequestTargetType;
  courseId: string;
  moduleId?: string | null;
  lessonId?: string | null;
}): Promise<Prisma.InputJsonValue | null> {
  if (input.targetType === ChangeRequestTargetType.COURSE) {
    const course = await db.course.findUnique({ where: { id: input.courseId } });
    if (!course) return null;
    return {
      title: course.title,
      shortDescription: course.shortDescription,
      durationHours: course.durationHours,
    };
  }

  if (input.targetType === ChangeRequestTargetType.MODULE && input.moduleId) {
    const mod = await db.module.findFirst({
      where: { id: input.moduleId, courseId: input.courseId },
    });
    if (!mod) return null;
    return { title: mod.title, sortOrder: mod.sortOrder };
  }

  if (input.targetType === ChangeRequestTargetType.LESSON && input.lessonId) {
    const lesson = await db.lesson.findFirst({
      where: {
        id: input.lessonId,
        module: { courseId: input.courseId },
      },
    });
    if (!lesson) return null;
    return {
      title: lesson.title,
      description: lesson.description,
      durationMinutes: lesson.durationMinutes,
      isPreviewGratis: lesson.isPreviewGratis,
      videoUrl: lesson.videoUrl,
      sortOrder: lesson.sortOrder,
      moduleId: lesson.moduleId,
    };
  }

  return null;
}

async function assertModuleInCourse(moduleId: string, courseId: string) {
  const mod = await db.module.findFirst({
    where: { id: moduleId, courseId },
  });
  if (!mod) throw new Error("Modul tidak ditemukan pada kelas ini.");
  return mod;
}

async function assertLessonInCourse(lessonId: string, courseId: string) {
  const lesson = await db.lesson.findFirst({
    where: {
      id: lessonId,
      module: { courseId },
    },
    include: { module: true },
  });
  if (!lesson) throw new Error("Pelajaran tidak ditemukan pada kelas ini.");
  return lesson;
}

export async function applyChangeRequest(
  request: CourseChangeRequest,
  payload: Record<string, unknown> | Prisma.InputJsonValue | null
): Promise<Prisma.InputJsonValue | null> {
  const data = asRecord(payload ?? request.proposedData);

  if (request.targetType === ChangeRequestTargetType.COURSE) {
    if (request.action !== ChangeRequestAction.UPDATE) {
      throw new Error("Aksi course hanya mendukung UPDATE.");
    }
    if (!data) throw new Error("Payload usulan course kosong.");

    const title = optionalTrimmedString(data.title);
    const shortDescription = optionalTrimmedString(data.shortDescription);
    const durationHours = optionalNumber(data.durationHours);

    if (!title && !shortDescription && durationHours === undefined) {
      throw new Error("Tidak ada field course yang diubah.");
    }

    const updated = await db.course.update({
      where: { id: request.courseId },
      data: {
        ...(title ? { title } : {}),
        ...(shortDescription ? { shortDescription } : {}),
        ...(durationHours !== undefined ? { durationHours: Math.max(0, Math.round(durationHours)) } : {}),
      },
    });
    return {
      title: updated.title,
      shortDescription: updated.shortDescription,
      durationHours: updated.durationHours,
    };
  }

  if (request.targetType === ChangeRequestTargetType.MODULE) {
    if (request.action === ChangeRequestAction.CREATE) {
      if (!data) throw new Error("Payload usulan modul kosong.");
      const title = optionalTrimmedString(data.title);
      if (!title) throw new Error("Judul modul wajib diisi.");
      const sortOrder = optionalNumber(data.sortOrder);
      const count = await db.module.count({ where: { courseId: request.courseId } });
      const created = await db.module.create({
        data: {
          courseId: request.courseId,
          title,
          sortOrder: sortOrder ?? count,
        },
      });
      return { id: created.id, title: created.title, sortOrder: created.sortOrder };
    }

    if (!request.moduleId) throw new Error("moduleId diperlukan.");
    await assertModuleInCourse(request.moduleId, request.courseId);

    if (request.action === ChangeRequestAction.DELETE) {
      await db.module.delete({ where: { id: request.moduleId } });
      return { deletedModuleId: request.moduleId };
    }

    if (!data) throw new Error("Payload usulan modul kosong.");
    const title = optionalTrimmedString(data.title);
    const sortOrder = optionalNumber(data.sortOrder);
    if (!title && sortOrder === undefined) {
      throw new Error("Tidak ada field modul yang diubah.");
    }

    const updated = await db.module.update({
      where: { id: request.moduleId },
      data: {
        ...(title ? { title } : {}),
        ...(sortOrder !== undefined ? { sortOrder: Math.max(0, Math.round(sortOrder)) } : {}),
      },
    });
    return { id: updated.id, title: updated.title, sortOrder: updated.sortOrder };
  }

  // LESSON
  if (request.action === ChangeRequestAction.CREATE) {
    if (!data) throw new Error("Payload usulan pelajaran kosong.");
    const moduleId =
      request.moduleId ?? optionalTrimmedString(data.moduleId) ?? null;
    if (!moduleId) throw new Error("moduleId diperlukan untuk membuat lesson.");
    const title = optionalTrimmedString(data.title);
    if (!title) throw new Error("Judul lesson wajib diisi.");

    await assertModuleInCourse(moduleId, request.courseId);

    const count = await db.lesson.count({ where: { moduleId } });
    const durationMinutes = optionalNumber(data.durationMinutes) ?? 10;
    const sortOrder = optionalNumber(data.sortOrder);
    const created = await db.lesson.create({
      data: {
        moduleId,
        title,
        description: optionalNullableString(data.description) ?? null,
        durationMinutes: Math.max(1, Math.round(durationMinutes)),
        isPreviewGratis: optionalBoolean(data.isPreviewGratis) ?? false,
        videoUrl: optionalNullableString(data.videoUrl) ?? null,
        sortOrder: sortOrder ?? count,
      },
    });
    return {
      id: created.id,
      title: created.title,
      description: created.description,
      durationMinutes: created.durationMinutes,
      isPreviewGratis: created.isPreviewGratis,
      videoUrl: created.videoUrl,
      sortOrder: created.sortOrder,
      moduleId: created.moduleId,
    };
  }

  if (!request.lessonId) throw new Error("lessonId diperlukan.");
  const existingLesson = await assertLessonInCourse(request.lessonId, request.courseId);

  if (request.action === ChangeRequestAction.DELETE) {
    await db.lesson.delete({ where: { id: request.lessonId } });
    return { deletedLessonId: request.lessonId };
  }

  if (!data) throw new Error("Payload usulan pelajaran kosong.");

  const nextModuleId = optionalTrimmedString(data.moduleId);
  if (nextModuleId && nextModuleId !== existingLesson.moduleId) {
    await assertModuleInCourse(nextModuleId, request.courseId);
  }

  const title = optionalTrimmedString(data.title);
  const description = optionalNullableString(data.description);
  const durationMinutes = optionalNumber(data.durationMinutes);
  const isPreviewGratis = optionalBoolean(data.isPreviewGratis);
  const videoUrl = optionalNullableString(data.videoUrl);
  const sortOrder = optionalNumber(data.sortOrder);

  if (
    !title &&
    description === undefined &&
    durationMinutes === undefined &&
    isPreviewGratis === undefined &&
    videoUrl === undefined &&
    sortOrder === undefined &&
    !nextModuleId
  ) {
    throw new Error("Tidak ada field pelajaran yang diubah.");
  }

  const updated = await db.lesson.update({
    where: { id: request.lessonId },
    data: {
      ...(title ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(durationMinutes !== undefined
        ? { durationMinutes: Math.max(1, Math.round(durationMinutes)) }
        : {}),
      ...(isPreviewGratis !== undefined ? { isPreviewGratis } : {}),
      ...(videoUrl !== undefined ? { videoUrl } : {}),
      ...(sortOrder !== undefined ? { sortOrder: Math.max(0, Math.round(sortOrder)) } : {}),
      ...(nextModuleId ? { moduleId: nextModuleId } : {}),
    },
  });

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    durationMinutes: updated.durationMinutes,
    isPreviewGratis: updated.isPreviewGratis,
    videoUrl: updated.videoUrl,
    sortOrder: updated.sortOrder,
    moduleId: updated.moduleId,
  };
}

/** Field-level before/after rows for UI review. */
export function buildChangeDiff(
  currentSnapshot: unknown,
  proposedData: unknown,
  action: "CREATE" | "UPDATE" | "DELETE"
): Array<{ key: string; before: unknown; after: unknown; changed: boolean }> {
  const before = asRecord(currentSnapshot) ?? {};
  const after = asRecord(proposedData) ?? {};

  if (action === "DELETE") {
    return Object.keys(before).map((key) => ({
      key,
      before: before[key],
      after: null,
      changed: true,
    }));
  }

  if (action === "CREATE") {
    return Object.keys(after).map((key) => ({
      key,
      before: null,
      after: after[key],
      changed: true,
    }));
  }

  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  return keys.map((key) => {
    const b = before[key];
    const a = key in after ? after[key] : b;
    return {
      key,
      before: b,
      after: a,
      changed: JSON.stringify(b) !== JSON.stringify(a),
    };
  });
}

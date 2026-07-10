import { VerificationStatus, type Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { instrumentToUi, levelToUi } from "@/lib/admin/server";
import { db } from "@/lib/db";
import type { Course, Mentor } from "@/lib/types";

const mentorInclude = { user: true } as const;

type DbMentorProfile = Prisma.MentorProfileGetPayload<{ include: typeof mentorInclude }>;

type DbCourse = Prisma.CourseGetPayload<{
  include: {
    mentor: { select: { slug: true } };
    modules: { include: { lessons: true } };
  };
}>;

function mapCatalogMentor(profile: DbMentorProfile): Mentor {
  return {
    slug: profile.slug,
    name: profile.user.nama,
    title: profile.title,
    initials: profile.initials,
    avatarUrl: profile.avatarUrl ?? undefined,
    instruments: (profile.instruments as Mentor["instruments"]) ?? [],
    verified: profile.verificationStatus === VerificationStatus.VERIFIED,
    licenseLabel: profile.licenseLabel ?? undefined,
    yearsExperience: profile.yearsExperience,
    studentsCount: profile.studentsCount,
    coursesCount: profile.coursesCount,
    rating: profile.rating,
    bio: profile.bio,
    philosophy: profile.philosophy,
    trackRecord: (profile.trackRecord as number[]) ?? [],
    availableFor1on1: profile.availableFor1on1,
    sessionPrice: profile.sessionPrice ?? undefined,
  };
}

function mapCatalogCourse(course: DbCourse): Course {
  return {
    slug: course.slug,
    title: course.title,
    mentorSlug: course.mentor.slug,
    instrument: instrumentToUi(course.instrument),
    level: levelToUi(course.level),
    price: course.price,
    rating: course.rating,
    studentsCount: course.studentsCount,
    durationHours: course.durationHours,
    shortDescription: course.shortDescription,
    outcomes: (course.outcomes as string[]) ?? [],
    modules: course.modules
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((mod) => ({
        title: mod.title,
        lessons: mod.lessons
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((lesson) => ({
            id: lesson.legacyId ?? lesson.id,
            title: lesson.title,
            durationMinutes: lesson.durationMinutes,
            preview: lesson.isPreviewGratis,
          })),
      })),
  };
}

/** Mentors visible in public catalog — verified profiles only. */
export async function getCatalogMentors(): Promise<Mentor[]> {
  const profiles = await db.mentorProfile.findMany({
    where: { verificationStatus: VerificationStatus.VERIFIED },
    include: mentorInclude,
    orderBy: [{ studentsCount: "desc" }, { createdAt: "desc" }],
  });

  return profiles.map(mapCatalogMentor);
}

/** Published courses from verified mentors. */
export async function getCatalogCourses(): Promise<Course[]> {
  const courses = await db.course.findMany({
    where: {
      isPublished: true,
      mentor: { verificationStatus: VerificationStatus.VERIFIED },
    },
    include: {
      mentor: { select: { slug: true } },
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
    orderBy: [{ studentsCount: "desc" }, { updatedAt: "desc" }],
  });

  return courses.map(mapCatalogCourse);
}

export async function getCatalogData(): Promise<{ courses: Course[]; mentors: Mentor[] }> {
  const [courses, mentors] = await Promise.all([getCatalogCourses(), getCatalogMentors()]);
  return { courses, mentors };
}

/** Call after admin changes that affect catalog visibility. */
export function revalidateCatalog() {
  revalidatePath("/katalog");
}

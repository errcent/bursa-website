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

/** Single mentor by slug — verified profiles only (public catalog). */
export async function getMentorBySlug(slug: string): Promise<Mentor | null> {
  const profile = await db.mentorProfile.findFirst({
    where: { slug, verificationStatus: VerificationStatus.VERIFIED },
    include: mentorInclude,
  });
  return profile ? mapCatalogMentor(profile) : null;
}

/** Published course by slug from a verified mentor. */
export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const course = await db.course.findFirst({
    where: {
      slug,
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
  });
  return course ? mapCatalogCourse(course) : null;
}

/** Published courses for a verified mentor. */
export async function getCoursesByMentor(mentorSlug: string): Promise<Course[]> {
  const courses = await db.course.findMany({
    where: {
      isPublished: true,
      mentor: {
        slug: mentorSlug,
        verificationStatus: VerificationStatus.VERIFIED,
      },
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

/** Slugs for static generation of mentor profile pages. */
export async function getCatalogMentorSlugs(): Promise<string[]> {
  const profiles = await db.mentorProfile.findMany({
    where: { verificationStatus: VerificationStatus.VERIFIED },
    select: { slug: true },
  });
  return profiles.map((p) => p.slug);
}

/** Slugs for static generation of course detail pages. */
export async function getCatalogCourseSlugs(): Promise<string[]> {
  const courses = await db.course.findMany({
    where: {
      isPublished: true,
      mentor: { verificationStatus: VerificationStatus.VERIFIED },
    },
    select: { slug: true },
  });
  return courses.map((c) => c.slug);
}

/** Recent reviews across all courses taught by a mentor. */
export async function getMentorReviews(mentorSlug: string, limit = 10) {
  const mentor = await db.mentorProfile.findFirst({
    where: { slug: mentorSlug, verificationStatus: VerificationStatus.VERIFIED },
    select: { courses: { select: { id: true } } },
  });
  if (!mentor || mentor.courses.length === 0) return [];

  const reviews = await db.review.findMany({
    where: { courseId: { in: mentor.courses.map((c) => c.id) } },
    include: { user: { select: { nama: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return reviews.map((review) => {
    const parts = review.user.nama.trim().split(/\s+/).filter(Boolean);
    const initials =
      parts.length === 0
        ? "?"
        : parts.length === 1
          ? parts[0].slice(0, 2).toUpperCase()
          : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();

    return {
      name: review.user.nama,
      initials,
      rating: review.rating,
      comment: review.comment,
      date: review.createdAt.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    };
  });
}

/** Call after admin changes that affect catalog visibility. */
export function revalidateCatalog() {
  revalidatePath("/katalog");
}

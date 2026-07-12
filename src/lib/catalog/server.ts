import { VerificationStatus, type Prisma } from "@prisma/client";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

import { instrumentToUi, levelToUi } from "@/lib/admin/server";
import { db } from "@/lib/db";
import { listCuratedPlaylists, serializePlaylistSummary } from "@/lib/playlist/server";
import type { PlaylistSummary } from "@/lib/playlist/types";
import type { Course, Mentor } from "@/lib/types";

const CATALOG_CACHE_TAG = "catalog";
const CATALOG_REVALIDATE_SECONDS = 60;

const mentorDetailInclude = { user: true } as const;

const mentorListingSelect = {
  slug: true,
  title: true,
  initials: true,
  avatarUrl: true,
  bio: true,
  instruments: true,
  licenseLabel: true,
  verificationStatus: true,
  yearsExperience: true,
  studentsCount: true,
  coursesCount: true,
  rating: true,
  availableFor1on1: true,
  sessionPrice: true,
  user: { select: { nama: true } },
} as const;

type DbMentorDetail = Prisma.MentorProfileGetPayload<{ include: typeof mentorDetailInclude }>;
type DbMentorListing = Prisma.MentorProfileGetPayload<{ select: typeof mentorListingSelect }>;

type DbCourseDetail = Prisma.CourseGetPayload<{
  include: {
    mentor: { select: { slug: true } };
    modules: { include: { lessons: true } };
  };
}>;

type DbCourseListing = Prisma.CourseGetPayload<{
  select: {
    slug: true;
    title: true;
    instrument: true;
    level: true;
    price: true;
    rating: true;
    studentsCount: true;
    durationHours: true;
    shortDescription: true;
    thumbnailUrl: true;
    outcomes: true;
    createdAt: true;
    mentor: { select: { slug: true } };
    _count: { select: { modules: true } };
  };
}>;

function mapCatalogMentor(profile: DbMentorDetail | DbMentorListing): Mentor {
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
    philosophy: "philosophy" in profile ? profile.philosophy : "",
    trackRecord: "trackRecord" in profile ? ((profile.trackRecord as number[]) ?? []) : [],
    availableFor1on1: profile.availableFor1on1,
    sessionPrice: profile.sessionPrice ?? undefined,
  };
}

function mapCatalogCourse(course: DbCourseDetail): Course {
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
    thumbnailUrl: course.thumbnailUrl ?? undefined,
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

function mapCatalogListingCourse(course: DbCourseListing): Course {
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
    thumbnailUrl: course.thumbnailUrl ?? undefined,
    outcomes: (course.outcomes as string[]) ?? [],
    modules: [],
    moduleCount: course._count.modules,
    createdAt: course.createdAt.toISOString(),
  };
}

async function fetchCatalogCoursesListing(): Promise<Course[]> {
  const courses = await db.course.findMany({
    where: {
      isPublished: true,
      mentor: { verificationStatus: VerificationStatus.VERIFIED },
    },
    select: {
      slug: true,
      title: true,
      instrument: true,
      level: true,
      price: true,
      rating: true,
      studentsCount: true,
      durationHours: true,
      shortDescription: true,
      thumbnailUrl: true,
      outcomes: true,
      createdAt: true,
      mentor: { select: { slug: true } },
      _count: { select: { modules: true } },
    },
    orderBy: [{ studentsCount: "desc" }, { updatedAt: "desc" }],
  });

  return courses.map(mapCatalogListingCourse);
}

async function fetchCatalogMentorsListing(): Promise<Mentor[]> {
  const profiles = await db.mentorProfile.findMany({
    where: { verificationStatus: VerificationStatus.VERIFIED },
    select: mentorListingSelect,
    orderBy: [{ studentsCount: "desc" }, { createdAt: "desc" }],
  });

  return profiles.map(mapCatalogMentor);
}

const getCachedCatalogData = unstable_cache(
  async () => {
    const [courses, mentors, playlists] = await Promise.all([
      fetchCatalogCoursesListing(),
      fetchCatalogMentorsListing(),
      listCuratedPlaylists(),
    ]);
    return {
      courses,
      mentors,
      playlists: playlists.map(serializePlaylistSummary),
    };
  },
  ["catalog-data"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] }
);

/** Mentors visible in public catalog — verified profiles only. */
export async function getCatalogMentors(): Promise<Mentor[]> {
  return fetchCatalogMentorsListing();
}

/** Published courses from verified mentors (listing payload, no module/lesson joins). */
export async function getCatalogCourses(): Promise<Course[]> {
  return fetchCatalogCoursesListing();
}

export async function getCatalogData(): Promise<{
  courses: Course[];
  mentors: Mentor[];
  playlists: PlaylistSummary[];
}> {
  return getCachedCatalogData();
}

/** Single mentor by slug — verified profiles only (public catalog). */
export async function getMentorBySlug(slug: string): Promise<Mentor | null> {
  const profile = await db.mentorProfile.findFirst({
    where: { slug, verificationStatus: VerificationStatus.VERIFIED },
    include: mentorDetailInclude,
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
  revalidateTag(CATALOG_CACHE_TAG, "max");
  revalidatePath("/katalog");
  revalidatePath("/");
  revalidatePath("/playlist");
}

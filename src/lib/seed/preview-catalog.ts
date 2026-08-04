import { randomBytes } from "node:crypto";

import {
  CourseLevel,
  type Prisma,
  type PrismaClient,
  Instrument,
  KycStatus,
  UserRole,
  VerificationStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

import { defaultCourseThumbnailPath } from "@/lib/courses/thumbnails";
import { courses, mentors } from "@/lib/mock-data";
import type { Instrument as MockInstrument, Level } from "@/lib/types";

export type DbClient = PrismaClient | Prisma.TransactionClient;

export type PreviewLessonVideoUrlResolver = (
  courseSlug: string,
  legacyLessonId: string
) => string | null;

export type SeedPreviewCatalogResult = {
  mentors: number;
  courses: number;
  playlists: number;
  skippedPlaylists: string[];
};

export const PREVIEW_MENTOR_EMAIL_DOMAIN = "@preview.bursanalar.com";

export function previewMentorEmail(slug: string): string {
  return `preview-mentor-${slug}${PREVIEW_MENTOR_EMAIL_DOMAIN}`;
}

export function mapInstrument(value: MockInstrument): Instrument {
  const map: Record<MockInstrument, Instrument> = {
    Saham: Instrument.SAHAM,
    Crypto: Instrument.CRYPTO,
    Forex: Instrument.FOREX,
  };
  return map[value];
}

export function mapLevel(value: Level): CourseLevel {
  const map: Record<Level, CourseLevel> = {
    Pemula: CourseLevel.PEMULA,
    Menengah: CourseLevel.MENENGAH,
    Mahir: CourseLevel.MAHIR,
  };
  return map[value];
}

export async function randomPasswordHash(): Promise<string> {
  return bcrypt.hash(randomBytes(32).toString("hex"), 10);
}

export const CURATED_PLAYLIST_DEFINITIONS: Array<{
  title: string;
  slug: string;
  description: string;
  lessonRefs: Array<{ courseSlug: string; legacyId: string }>;
}> = [
  {
    title: "Kesehatan Mental Trading",
    slug: "kesehatan-mental-trading",
    description: "Kurasi modul psikologi, disiplin, dan mindset dari lima mentor berbeda.",
    lessonRefs: [
      { courseSlug: "psikologi-trading-anti-fomo", legacyId: "l1" },
      { courseSlug: "manajemen-risiko-crypto-pemula", legacyId: "l4" },
      { courseSlug: "swing-trading-teknikal-dasar", legacyId: "l8" },
      { courseSlug: "scalping-saham-intraday-jam-perdagangan", legacyId: "l2" },
      { courseSlug: "price-action-forex-tanpa-indikator", legacyId: "l6" },
    ],
  },
  {
    title: "Fundasi Analisis Saham",
    slug: "fundasi-analisis-saham",
    description: "Tiga pelajaran pembuka untuk memahami fundamental dan valuasi.",
    lessonRefs: [
      { courseSlug: "fundamental-saham-untuk-pemula", legacyId: "l1" },
      { courseSlug: "fundamental-saham-untuk-pemula", legacyId: "l2" },
      { courseSlug: "membaca-laporan-keuangan-lanjutan", legacyId: "l1" },
    ],
  },
  {
    title: "Jalur Crypto Pemula",
    slug: "jalur-crypto-pemula",
    description: "Mulai dari on-chain dasar hingga manajemen risiko untuk trader crypto baru.",
    lessonRefs: [
      { courseSlug: "crypto-on-chain-dasar", legacyId: "l1" },
      { courseSlug: "crypto-on-chain-dasar", legacyId: "l2" },
      { courseSlug: "manajemen-risiko-crypto-pemula", legacyId: "l1" },
      { courseSlug: "manajemen-risiko-crypto-pemula", legacyId: "l2" },
      { courseSlug: "manajemen-risiko-crypto-pemula", legacyId: "l3" },
    ],
  },
  {
    title: "Teknikal Swing Trading",
    slug: "teknikal-swing-trading",
    description:
      "Rangkaian pelajaran candlestick, support/resistance, dan manajemen posisi untuk swing trader.",
    lessonRefs: [
      { courseSlug: "swing-trading-teknikal-dasar", legacyId: "l1" },
      { courseSlug: "swing-trading-teknikal-dasar", legacyId: "l2" },
      { courseSlug: "swing-trading-teknikal-dasar", legacyId: "l3" },
      { courseSlug: "swing-trading-teknikal-dasar", legacyId: "l4" },
      { courseSlug: "swing-trading-teknikal-dasar", legacyId: "l5" },
    ],
  },
  {
    title: "Forex dari Nol",
    slug: "forex-dari-nol",
    description: "Memahami makro, suku bunga, dan reaksi pasar forex untuk pemula.",
    lessonRefs: [
      { courseSlug: "forex-makro-dasar", legacyId: "l1" },
      { courseSlug: "forex-makro-dasar", legacyId: "l2" },
      { courseSlug: "forex-makro-dasar", legacyId: "l3" },
      { courseSlug: "forex-makro-dasar", legacyId: "l4" },
    ],
  },
  {
    title: "Valuasi Lanjutan",
    slug: "valuasi-lanjutan",
    description: "DCF, proyeksi arus kas, dan perbandingan sektor untuk analis yang ingin naik level.",
    lessonRefs: [
      { courseSlug: "membaca-laporan-keuangan-lanjutan", legacyId: "l1" },
      { courseSlug: "membaca-laporan-keuangan-lanjutan", legacyId: "l3" },
      { courseSlug: "membaca-laporan-keuangan-lanjutan", legacyId: "l4" },
      { courseSlug: "membaca-laporan-keuangan-lanjutan", legacyId: "l5" },
      { courseSlug: "membaca-laporan-keuangan-lanjutan", legacyId: "l7" },
    ],
  },
  {
    title: "Screening Saham Berkualitas",
    slug: "screening-saham-berkualitas",
    description: "Dari membaca laporan keuangan hingga menyusun watchlist emiten berkualitas.",
    lessonRefs: [
      { courseSlug: "fundamental-saham-untuk-pemula", legacyId: "l2" },
      { courseSlug: "fundamental-saham-untuk-pemula", legacyId: "l5" },
      { courseSlug: "fundamental-saham-untuk-pemula", legacyId: "l6" },
      { courseSlug: "fundamental-saham-untuk-pemula", legacyId: "l7" },
      { courseSlug: "fundamental-saham-untuk-pemula", legacyId: "l8" },
    ],
  },
];

type MentorUserResolver = (
  mentor: (typeof mentors)[number],
  index: number
) => Promise<{ id: string }>;

function mentorProfileData(mentor: (typeof mentors)[number]) {
  return {
    title: mentor.title,
    initials: mentor.initials,
    avatarUrl: mentor.avatarUrl,
    bio: mentor.bio,
    philosophy: mentor.philosophy,
    spesialisasi: mentor.title,
    instruments: mentor.instruments,
    licenseLabel: mentor.licenseLabel,
    verificationStatus: mentor.verified
      ? VerificationStatus.VERIFIED
      : VerificationStatus.PENDING,
    yearsExperience: mentor.yearsExperience,
    studentsCount: mentor.studentsCount,
    coursesCount: mentor.coursesCount,
    rating: mentor.rating,
    trackRecord: mentor.trackRecord,
    availableFor1on1: mentor.availableFor1on1,
    sessionPrice: mentor.sessionPrice,
  };
}

export async function upsertMentorProfiles(
  client: DbClient,
  resolveUser: MentorUserResolver
): Promise<Map<string, string>> {
  const mentorProfileMap = new Map<string, string>();

  for (const [index, mentor] of mentors.entries()) {
    const user = await resolveUser(mentor, index);

    const profile = await client.mentorProfile.upsert({
      where: { slug: mentor.slug },
      create: {
        userId: user.id,
        slug: mentor.slug,
        ...mentorProfileData(mentor),
      },
      update: mentorProfileData(mentor),
    });

    mentorProfileMap.set(mentor.slug, profile.id);
  }

  return mentorProfileMap;
}

export async function upsertPreviewMentors(client: DbClient): Promise<Map<string, string>> {
  return upsertMentorProfiles(client, async (mentor, index) => {
    const email = previewMentorEmail(mentor.slug);
    const passwordHash = await randomPasswordHash();

    return client.user.upsert({
      where: { email },
      create: {
        email,
        username: `preview_${mentor.slug.replace(/-/g, "_")}`,
        phone: `+62819${String(7000000 + index).slice(-7)}`,
        passwordHash,
        nama: mentor.name,
        role: UserRole.MENTOR,
        kycStatus: KycStatus.NOT_REQUIRED,
      },
      update: {
        nama: mentor.name,
        role: UserRole.MENTOR,
      },
    });
  });
}

export async function upsertCoursesFromMockData(
  client: DbClient,
  mentorProfileMap: Map<string, string>,
  options: { previewLessonVideoUrl: PreviewLessonVideoUrlResolver }
): Promise<number> {
  let count = 0;

  for (const course of courses) {
    const mentorId = mentorProfileMap.get(course.mentorSlug);
    if (!mentorId) continue;

    const courseData = {
      title: course.title,
      mentorId,
      instrument: mapInstrument(course.instrument),
      level: mapLevel(course.level),
      price: course.price,
      rating: course.rating,
      studentsCount: course.studentsCount,
      durationHours: course.durationHours,
      shortDescription: course.shortDescription,
      thumbnailUrl: course.thumbnailUrl ?? defaultCourseThumbnailPath(course.slug),
      outcomes: course.outcomes,
      isPublished: true,
    };

    const existing = await client.course.findUnique({
      where: { slug: course.slug },
      select: { id: true },
    });

    const courseId = existing
      ? (
          await client.course.update({
            where: { slug: course.slug },
            data: courseData,
          })
        ).id
      : (
          await client.course.create({
            data: { slug: course.slug, ...courseData },
          })
        ).id;

    if (existing) {
      await client.module.deleteMany({ where: { courseId } });
    }

    for (const [moduleIndex, module] of course.modules.entries()) {
      const createdModule = await client.module.create({
        data: {
          courseId,
          title: module.title,
          sortOrder: moduleIndex,
        },
      });

      for (const [lessonIndex, lesson] of module.lessons.entries()) {
        await client.lesson.create({
          data: {
            moduleId: createdModule.id,
            legacyId: lesson.id,
            title: lesson.title,
            durationMinutes: lesson.durationMinutes,
            isPreviewGratis: lesson.preview ?? false,
            videoUrl: lesson.preview
              ? options.previewLessonVideoUrl(course.slug, lesson.id)
              : null,
            sortOrder: lessonIndex,
          },
        });
      }
    }

    count += 1;
  }

  return count;
}

async function findLessonByCourseAndLegacy(
  client: DbClient,
  courseSlug: string,
  legacyId: string
) {
  return client.lesson.findFirst({
    where: {
      legacyId,
      module: { course: { slug: courseSlug } },
    },
    select: { id: true },
  });
}

export async function upsertCuratedPlaylists(
  client: DbClient,
  ownerUserId: string
): Promise<{ created: number; skipped: string[] }> {
  let created = 0;
  const skipped: string[] = [];

  for (const definition of CURATED_PLAYLIST_DEFINITIONS) {
    const resolved = await Promise.all(
      definition.lessonRefs.map(async (ref) => ({
        ref,
        lesson: await findLessonByCourseAndLegacy(client, ref.courseSlug, ref.legacyId),
      }))
    );

    const lessonIds = resolved
      .filter((entry): entry is { ref: (typeof definition.lessonRefs)[number]; lesson: { id: string } } =>
        Boolean(entry.lesson)
      )
      .map((entry) => entry.lesson.id);

    if (lessonIds.length === 0) {
      skipped.push(definition.slug);
      continue;
    }

    const existing = await client.playlist.findUnique({
      where: { slug: definition.slug },
      select: { id: true },
    });

    if (existing) {
      await client.playlistItem.deleteMany({ where: { playlistId: existing.id } });
      await client.playlist.update({
        where: { id: existing.id },
        data: {
          title: definition.title,
          description: definition.description,
          userId: ownerUserId,
          isCurated: true,
          isPublished: true,
          items: {
            create: lessonIds.map((lessonId, index) => ({
              lessonId,
              sortOrder: index,
            })),
          },
        },
      });
    } else {
      await client.playlist.create({
        data: {
          userId: ownerUserId,
          title: definition.title,
          description: definition.description,
          slug: definition.slug,
          isCurated: true,
          isPublished: true,
          items: {
            create: lessonIds.map((lessonId, index) => ({
              lessonId,
              sortOrder: index,
            })),
          },
        },
      });
    }

    created += 1;
  }

  return { created, skipped };
}

export async function resolvePlaylistOwnerUserId(client: DbClient): Promise<string> {
  const admin = await client.user.findFirst({
    where: { role: UserRole.ADMIN },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true },
  });

  if (!admin) {
    throw new Error(
      "Tidak ada user ADMIN di database. Jalankan bootstrap:production-admin terlebih dahulu."
    );
  }

  return admin.id;
}

/** Production-safe additive catalog seed (mentors, courses, playlists). */
export async function seedPreviewCatalog(client: DbClient): Promise<SeedPreviewCatalogResult> {
  const mentorProfileMap = await upsertPreviewMentors(client);
  const courseCount = await upsertCoursesFromMockData(client, mentorProfileMap, {
    previewLessonVideoUrl: () => null,
  });
  const ownerUserId = await resolvePlaylistOwnerUserId(client);
  const { created: playlistCount, skipped } = await upsertCuratedPlaylists(client, ownerUserId);

  return {
    mentors: mentorProfileMap.size,
    courses: courseCount,
    playlists: playlistCount,
    skippedPlaylists: skipped,
  };
}

/** Dev seed: CDN preview URLs for local testing. */
export function devPreviewLessonVideoUrl(courseSlug: string, legacyLessonId: string): string {
  return `https://cdn.bursa.dev/preview/${courseSlug}/${legacyLessonId}.mp4`;
}

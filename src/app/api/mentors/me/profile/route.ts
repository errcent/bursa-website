import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { requireMentor, unauthorizedMentor } from "@/lib/mentor/server";

type SocialLinksInput = {
  instagram?: string;
  youtube?: string;
  twitter?: string;
};

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateSocialLinks(links: SocialLinksInput | null | undefined): string | null {
  if (!links) return null;
  for (const [key, value] of Object.entries(links)) {
    if (value === undefined || value === "") continue;
    if (typeof value !== "string" || !isValidUrl(value)) {
      return `URL ${key} tidak valid.`;
    }
  }
  return null;
}

export async function GET(request: Request) {
  const mentor = await requireMentor(request);
  if (!mentor) return unauthorizedMentor();

  const profile = mentor.mentorProfile!;
  const socialLinks = (profile.socialLinks as SocialLinksInput | null) ?? null;

  return NextResponse.json({
    id: profile.id,
    slug: profile.slug,
    title: profile.title,
    initials: profile.initials,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    tagline: profile.tagline,
    socialLinks,
    verificationStatus: profile.verificationStatus,
    rating: profile.rating,
    studentsCount: profile.studentsCount,
    coursesCount: profile.coursesCount,
    name: mentor.nama,
    email: mentor.email,
  });
}

export async function PATCH(request: Request) {
  const mentor = await requireMentor(request);
  if (!mentor) return unauthorizedMentor();

  try {
    const body = (await request.json()) as {
      bio?: string;
      tagline?: string | null;
      socialLinks?: SocialLinksInput | null;
    };

    if (body.bio !== undefined) {
      const len = body.bio.trim().length;
      if (len < 100 || len > 800) {
        return NextResponse.json(
          { error: "Bio harus 100–800 karakter." },
          { status: 422 }
        );
      }
    }

    if (body.tagline !== undefined && body.tagline !== null) {
      if (body.tagline.trim().length > 80) {
        return NextResponse.json(
          { error: "Tagline maksimal 80 karakter." },
          { status: 422 }
        );
      }
    }

    const socialError = validateSocialLinks(body.socialLinks);
    if (socialError) {
      return NextResponse.json({ error: socialError }, { status: 422 });
    }

    const profile = await db.mentorProfile.update({
      where: { id: mentor.mentorProfile!.id },
      data: {
        bio: body.bio?.trim(),
        tagline:
          body.tagline === undefined
            ? undefined
            : body.tagline === null
              ? null
              : body.tagline.trim() || null,
        socialLinks:
          body.socialLinks === undefined
            ? undefined
            : body.socialLinks === null
              ? Prisma.JsonNull
              : (body.socialLinks as Prisma.InputJsonValue),
      },
    });

    revalidatePath(`/instruktur/${profile.slug}`);
    revalidatePath("/katalog");

    const socialLinks = (profile.socialLinks as SocialLinksInput | null) ?? null;

    return NextResponse.json({
      id: profile.id,
      slug: profile.slug,
      title: profile.title,
      initials: profile.initials,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      tagline: profile.tagline,
      socialLinks,
      verificationStatus: profile.verificationStatus,
      rating: profile.rating,
      studentsCount: profile.studentsCount,
      coursesCount: profile.coursesCount,
      name: mentor.nama,
      email: mentor.email,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memperbarui profil mentor." }, { status: 500 });
  }
}

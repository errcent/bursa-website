import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { SessionBookingPage } from "@/components/session-booking";
import { getMentorBySlug } from "@/lib/mock-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const mentor = getMentorBySlug(slug);
  if (!mentor) return {};
  return {
    title: `Jadwal Sesi 1-on-1 · ${mentor.name}`,
    description: `Lihat dan booking sesi 1-on-1 dengan ${mentor.name}.`,
  };
}

export default async function MentorSessionPage({ params }: PageProps) {
  const { slug } = await params;
  const mentor = getMentorBySlug(slug);
  if (!mentor) notFound();

  if (!mentor.availableFor1on1) {
    notFound();
  }

  return (
    <SessionBookingPage
      slug={slug}
      mentorName={mentor.name}
      sessionPrice={mentor.sessionPrice}
    />
  );
}

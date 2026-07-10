import { MentorSessionManager } from "@/components/admin/mentor-session-manager";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminMentorSessionsPage({ params }: PageProps) {
  const { id } = await params;

  const mentor = await db.mentorProfile.findUnique({
    where: { id },
    include: { user: { select: { nama: true } } },
  });

  if (!mentor) notFound();

  return <MentorSessionManager mentorId={id} mentorName={mentor.user.nama} />;
}

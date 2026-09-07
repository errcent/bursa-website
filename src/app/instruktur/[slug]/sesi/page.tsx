import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** Booking 1-on-1 dihapus; tautan lama diarahkan ke profil mentor. */
export default async function MentorSessionRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/instruktur/${slug}`);
}

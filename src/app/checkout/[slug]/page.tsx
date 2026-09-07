import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** Checkout per-course dihapus; tautan lama diarahkan ke detail kelas. */
export default async function CheckoutRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/kelas/${slug}`);
}

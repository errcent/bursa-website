import {
  generatePortalMetadata,
  portalStaticParams,
  renderPortalPage,
} from "@/lib/public-documents/portal-page";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const docSlug = slug?.[0];
  return generatePortalMetadata("privasi", docSlug);
}

export function generateStaticParams() {
  return portalStaticParams("privasi");
}

export default async function PrivasiPage({ params }: PageProps) {
  const { slug } = await params;
  return renderPortalPage("privasi", slug?.[0]);
}

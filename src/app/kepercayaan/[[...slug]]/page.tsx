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
  return generatePortalMetadata("kepercayaan", docSlug);
}

export function generateStaticParams() {
  return portalStaticParams("kepercayaan");
}

export default async function KepercayaanPage({ params }: PageProps) {
  const { slug } = await params;
  return renderPortalPage("kepercayaan", slug?.[0]);
}

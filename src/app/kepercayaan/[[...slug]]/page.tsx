import {
  generatePortalMetadata,
  portalStaticParams,
  renderPortalPage,
} from "@/lib/public-documents/portal-page";
import { resolvePortalLocale } from "@/lib/public-documents/locale";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const { locale, docSlug } = await resolvePortalLocale(slug);
  return generatePortalMetadata("kepercayaan", docSlug, locale);
}

export function generateStaticParams() {
  return portalStaticParams("kepercayaan");
}

export default async function KepercayaanPage({ params }: PageProps) {
  const { slug } = await params;
  const { locale, docSlug } = await resolvePortalLocale(slug);
  return renderPortalPage("kepercayaan", docSlug, locale);
}

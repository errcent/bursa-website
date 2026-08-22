import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { ADMIN_HOST, hostRole, normalizeHost } from "@/lib/hosts/hosts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bursanalar.com";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = normalizeHost((await headers()).get("host"));
  if (hostRole(host) === "admin" || host === ADMIN_HOST) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/developer/",
        "/api/",
        "/dashboard",
        "/pengaturan",
        "/profil",
        "/checkout/",
        "/wave-lab",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

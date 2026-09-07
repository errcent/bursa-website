import type { Metadata, Viewport } from "next";
import { DM_Sans, IBM_Plex_Mono, Inter, Montserrat_Alternates, Source_Serif_4 } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";

import { AuthProvider } from "@/components/auth-provider";
import { PostHogProvider } from "@/components/analytics/posthog-provider";
import { NextAuthProvider } from "@/components/next-auth-provider";
import { CursorGlow } from "@/components/cursor-glow";
import { NavbarRouteTracker } from "@/components/navbar-route-tracker";
import { PreloaderGate } from "@/components/preloader-gate";
import { CookieConsentBanner } from "@/components/trust-portal/cookie-consent-banner";
import { PreviewCatalogBanner } from "@/components/preview-catalog/preview-catalog-banner";

import { SearchSeoJsonLd } from "@/components/search/search-seo-jsonld";
import {
  isNoteLayoutSurface,
  isPrivacyPortalSurface,
  isTrustPortalSurface,
  NOTE_SURFACE_HEADER,
  PRIVACY_SURFACE_HEADER,
  TRUST_SURFACE_HEADER,
} from "@/lib/hosts/hosts";
import { rootSiteMetadata } from "@/lib/site-metadata";

import "./globals.css";

/** Body / UI copy, light & regular weights */
const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

/** Headings, bold text, buttons, brand wordmark */
const fontHeading = DM_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

/** Product wordmark "bursa" — matches logo_product_bursa_navbar */
const fontMontAlt = Montserrat_Alternates({
  variable: "--font-mont-alt",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

/** Trust Center register headlines */
const fontTrustSerif = Source_Serif_4({
  variable: "--font-trust-serif",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

/** Trust Center metadata / stamps */
const fontTrustMono = IBM_Plex_Mono({
  variable: "--font-trust-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/** Runs before first paint so intro-pending CSS hides content until PreloaderGate hydrates. */
const INTRO_PENDING_SCRIPT = `(function(){try{if(!sessionStorage.getItem("bursa-intro-seen")){document.documentElement.classList.add("intro-pending")}if(/(^|\\/)en(\\/|$)/.test(location.pathname)){document.documentElement.lang="en"}}catch(e){}})();`;

export const metadata: Metadata = rootSiteMetadata;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const noteSurface = isNoteLayoutSurface(
    headerList.get("host"),
    headerList.get(NOTE_SURFACE_HEADER)
  );
  const privacySurface = isPrivacyPortalSurface(
    headerList.get("host"),
    headerList.get(PRIVACY_SURFACE_HEADER)
  );
  const trustSurface = isTrustPortalSurface(
    headerList.get("host"),
    headerList.get(TRUST_SURFACE_HEADER)
  );
  const legalSurface = privacySurface || trustSurface;
  const minimalSurface = noteSurface || legalSurface;

  return (
    <html
      lang="id"
      className={`${fontSans.variable} ${fontHeading.variable} ${fontMontAlt.variable} ${fontTrustSerif.variable} ${fontTrustMono.variable} ${privacySurface ? "" : "dark"} h-full antialiased`}
      data-scroll-behavior="smooth"
      data-note-surface={noteSurface ? "1" : undefined}
      data-portal-surface={privacySurface ? "privacy" : trustSurface ? "trust" : undefined}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col overflow-x-hidden bg-background text-foreground"
        suppressHydrationWarning
      >
        {minimalSurface ? null : (
          <Script
            id="bursa-intro-pending"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: INTRO_PENDING_SCRIPT }}
          />
        )}
        {minimalSurface ? null : <SearchSeoJsonLd />}
        <PostHogProvider />
        {minimalSurface ? null : <CursorGlow />}
        {noteSurface ? (
          <NextAuthProvider>
            <AuthProvider>{children}</AuthProvider>
          </NextAuthProvider>
        ) : (
          <PreloaderGate skip={legalSurface}>
            {legalSurface ? null : <NavbarRouteTracker />}
            <NextAuthProvider>
              <AuthProvider>
                {legalSurface ? null : <PreviewCatalogBanner />}
                {children}
              </AuthProvider>
            </NextAuthProvider>
          </PreloaderGate>
        )}
        {minimalSurface ? null : <CookieConsentBanner />}
      </body>
    </html>
  );
}

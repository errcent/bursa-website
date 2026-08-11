import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, Outfit } from "next/font/google";
import Script from "next/script";

import { AuthProvider } from "@/components/auth-provider";
import { PostHogProvider } from "@/components/analytics/posthog-provider";
import { NextAuthProvider } from "@/components/next-auth-provider";
import { LanguageProvider } from "@/components/language-provider";
import { CursorGlow } from "@/components/cursor-glow";
import { NavbarRouteTracker } from "@/components/navbar-route-tracker";
import { PreloaderGate } from "@/components/preloader-gate";
import { StickyBottomCta } from "@/components/sticky-bottom-cta";
import { CookieConsentBanner } from "@/components/trust-portal/cookie-consent-banner";
import { PreviewCatalogBanner } from "@/components/preview-catalog/preview-catalog-banner";

import { SearchSeoJsonLd } from "@/components/search/search-seo-jsonld";
import { rootSiteMetadata } from "@/lib/site-metadata";

import "./globals.css";

/** Body / UI copy */
const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

/** UI headings, buttons, nav chrome */
const fontHeading = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

/** Display / hero / marketing section titles */
const fontDisplay = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/** Runs before first paint so intro-pending CSS hides content until PreloaderGate hydrates. */
const INTRO_PENDING_SCRIPT = `(function(){try{if(!sessionStorage.getItem("bursa-intro-seen")){document.documentElement.classList.add("intro-pending")}}catch(e){}})();`;

export const metadata: Metadata = rootSiteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${fontSans.variable} ${fontHeading.variable} ${fontDisplay.variable} dark h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-background text-foreground">
        <Script
          id="bursa-intro-pending"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: INTRO_PENDING_SCRIPT }}
        />
        <SearchSeoJsonLd />
        <PostHogProvider />
        <CursorGlow />
        <PreloaderGate>
          <NavbarRouteTracker />
          <NextAuthProvider>
            <AuthProvider>
              <LanguageProvider>
                <PreviewCatalogBanner />
                {children}
                <StickyBottomCta />
                <CookieConsentBanner />
              </LanguageProvider>
            </AuthProvider>
          </NextAuthProvider>
        </PreloaderGate>
      </body>
    </html>
  );
}

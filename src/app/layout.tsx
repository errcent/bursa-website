import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, JetBrains_Mono, Montserrat, Montserrat_Alternates } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { NextAuthProvider } from "@/components/next-auth-provider";
import { LanguageProvider } from "@/components/language-provider";
import { CursorGlow } from "@/components/cursor-glow";
import { NavbarRouteTracker } from "@/components/navbar-route-tracker";
import { PreloaderGate } from "@/components/preloader-gate";
import { StickyBottomCta } from "@/components/sticky-bottom-cta";
import { CookieConsentBanner } from "@/components/trust-portal/cookie-consent-banner";

import { SearchSeoJsonLd } from "@/components/search/search-seo-jsonld";

import "./globals.css";

/** Body / UI copy — light & regular weights */
const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

/** Headings, bold text, buttons */
const fontHeading = Montserrat({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

/** Preloader brand wordmark only ("bursanalar.") */
const fontBrandAlt = Montserrat_Alternates({
  variable: "--font-brand-alt",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

/** Tags, badges, terminal labels */
const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Bursa — Katalog Mentor dan Kelas Trading",
    template: "%s · Bursa",
  },
  description:
    "Platform edukasi trading dengan katalog mentor dan kelas saham, crypto, serta forex. Fokus pada proses belajar, riset, dan manajemen risiko.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${fontSans.variable} ${fontHeading.variable} ${fontBrandAlt.variable} ${fontMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-background text-foreground">
        <SearchSeoJsonLd />
        <Script id="bursa-intro-pending" strategy="beforeInteractive">
          {`(function(){try{if(!sessionStorage.getItem("bursa-intro-seen")){document.documentElement.classList.add("intro-pending")}}catch(e){}})();`}
        </Script>
        <ThemeProvider>
          <CursorGlow />
          <PreloaderGate>
            <NavbarRouteTracker />
            <NextAuthProvider>
              <AuthProvider>
                <LanguageProvider>
                  {children}
                  <StickyBottomCta />
                  <CookieConsentBanner />
                </LanguageProvider>
              </AuthProvider>
            </NextAuthProvider>
          </PreloaderGate>
        </ThemeProvider>
      </body>
    </html>
  );
}

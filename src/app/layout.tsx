import type { Metadata } from "next";
import Script from "next/script";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { NextAuthProvider } from "@/components/next-auth-provider";
import { LanguageProvider } from "@/components/language-provider";
import { CursorGlow } from "@/components/cursor-glow";
import { PreloaderGate } from "@/components/preloader-gate";
import { StickyBottomCta } from "@/components/sticky-bottom-cta";

import { SearchSeoJsonLd } from "@/components/search/search-seo-jsonld";

import "./globals.css";

/** Body / UI copy */
const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

/** Display headings */
const fontHeading = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Tags, badges, terminal labels */
const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

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
      className={`${fontSans.variable} ${fontHeading.variable} ${fontMono.variable} h-full antialiased`}
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
            <NextAuthProvider>
              <AuthProvider>
                <LanguageProvider>
                  {children}
                  <StickyBottomCta />
                </LanguageProvider>
              </AuthProvider>
            </NextAuthProvider>
          </PreloaderGate>
        </ThemeProvider>
      </body>
    </html>
  );
}

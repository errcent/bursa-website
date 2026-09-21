import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Production Next/Turbopack does not need eval. Dev: React 19 reconstructs
      // stacks via eval() - omit this in prod (QC-20260819-06 / BN-SEC-009).
      // Keep script/style unsafe-inline until BN-SEC-009 nonce migration.
      `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} https://challenges.cloudflare.com https://*.posthog.com https://s3.tradingview.com`,
      "style-src 'self' 'unsafe-inline'",
      "object-src 'none'",
      // U-010: drop blanket https: on img/connect.
      "img-src 'self' data: blob: https://*.b-cdn.net https://*.bunnycdn.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://*.posthog.com https://us.i.posthog.com https://eu.i.posthog.com",
      "media-src 'self' blob: https://*.b-cdn.net https://*.bunnycdn.com",
      "font-src 'self' data:",
      "connect-src 'self' https://bursanalar.com https://*.bursanalar.com https://*.posthog.com https://us.i.posthog.com https://eu.i.posthog.com https://s3.tradingview.com https://*.tradingview.com wss://*.tradingview.com https://challenges.cloudflare.com https://oauth2.googleapis.com",
      "frame-src https://challenges.cloudflare.com https://www.tradingview.com https://*.tradingview.com https://www.tradingview-widget.com https://*.tradingview-widget.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    qualities: [75, 90],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    const canonicalHostRedirects = [
      "bursanalar.vercel.app",
      "bursa-website.vercel.app",
      "bursanalar-errcent1.vercel.app",
      "bursanalar-git-master-errcent1.vercel.app",
      "www.bursanalar.com",
    ].map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://bursanalar.com/:path*",
      permanent: true,
    }));

    return [
      ...canonicalHostRedirects,
      {
        source: "/kebijakan-privasi",
        destination: "/privasi/kebijakan",
        permanent: true,
      },
      {
        source: "/syarat-dan-ketentuan",
        destination: "/terms",
        permanent: true,
      },
      { source: "/jadi-mentor", destination: "/bantuan", permanent: true },
      { source: "/daftar", destination: "/waitlist?from=daftar", permanent: false },
      { source: "/daftar/:path*", destination: "/waitlist?from=daftar", permanent: false },
      { source: "/lab", destination: "/katalog", permanent: true },
      { source: "/lab/:path*", destination: "/katalog", permanent: true },
    ];
  },
};

export default nextConfig;

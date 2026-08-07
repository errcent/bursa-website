import type { NextConfig } from "next";

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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.posthog.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      // Native <video> falls back to default-src when media-src is omitted — that
      // blocks Bunny CDN + demo MP4 hosts (MEDIA_ERR_SRC_NOT_SUPPORTED / URL safety).
      "media-src 'self' blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-src https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
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
      { source: "/lab/backtester", destination: "/lab", permanent: true },
      { source: "/lab/portfolio-var", destination: "/lab", permanent: true },
      { source: "/lab/volatility", destination: "/lab", permanent: true },
    ];
  },
};

export default nextConfig;

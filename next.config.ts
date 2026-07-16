import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/kebijakan-privasi",
        destination: "/privasi/kebijakan",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  async rewrites() {
    return [
      {
        source: "/start/web-foundations",
        destination:
          "/learn/web-development-foundations/semantic-html?entry_source=founder_warm",
      },
    ];
  },
};

export default nextConfig;

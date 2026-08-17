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
      {
        source: "/start/web-foundations/directory",
        destination:
          "/learn/web-development-foundations/semantic-html?entry_source=directory",
      },
      {
        source: "/start/web-foundations/community",
        destination:
          "/learn/web-development-foundations/semantic-html?entry_source=community",
      },
      {
        source: "/start/web-foundations/walkthrough",
        destination:
          "/learn/web-development-foundations/semantic-html?entry_source=walkthrough",
      },
    ];
  },
};

export default nextConfig;

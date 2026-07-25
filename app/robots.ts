import type { MetadataRoute } from "next";

const productionUrl = "https://lovable-original-eight.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${productionUrl}/sitemap.xml`,
  };
}

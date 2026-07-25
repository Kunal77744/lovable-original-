import type { MetadataRoute } from "next";

const productionUrl = "https://lovable-original-eight.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: productionUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${productionUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}

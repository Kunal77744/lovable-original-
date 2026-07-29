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
    {
      url: `${productionUrl}/courses/web-development-foundations`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${productionUrl}/practice`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${productionUrl}/learn/semantic-html`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${productionUrl}/learn/semantic-html-project`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${productionUrl}/learn/beginner-javascript-practice`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}

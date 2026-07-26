import type { MetadataRoute } from "next";
import { LEARNING_PATHS } from "@/lib/first-course-content";

const productionUrl = "https://lovable-original-eight.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const learningPathPages = LEARNING_PATHS.flatMap((path) => [
    {
      url: `${productionUrl}/courses/${path.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
    ...path.lessons.map((lesson) => ({
      url: `${productionUrl}/learn/${path.slug}/${lesson.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
  ]);

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
      url: `${productionUrl}/courses`,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    ...learningPathPages,
  ];
}

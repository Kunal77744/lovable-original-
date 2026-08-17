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
      url: `${productionUrl}/learn/web-development-foundations/css-selectors-box-model`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${productionUrl}/learn/web-development-foundations/accessible-html-forms`,
      changeFrequency: "monthly",
      priority: 0.8,
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
      url: `${productionUrl}/learn/why-use-semantic-html`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${productionUrl}/learn/semantic-html-project`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${productionUrl}/learn/semantic-html-cheat-sheet`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${productionUrl}/learn/beginner-javascript-practice`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${productionUrl}/learn/what-is-the-css-box-model`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${productionUrl}/learn/how-to-practice-javascript`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}

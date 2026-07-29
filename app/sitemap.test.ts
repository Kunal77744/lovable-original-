import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";

const productionUrl = "https://lovable-original-eight.vercel.app";

describe("public sitemap", () => {
  it("preserves the current public discovery routes and ordering", () => {
    expect(sitemap().map(({ url }) => url)).toEqual([
      productionUrl,
      `${productionUrl}/about`,
      `${productionUrl}/courses/web-development-foundations`,
      `${productionUrl}/practice`,
      `${productionUrl}/learn/semantic-html`,
      `${productionUrl}/learn/semantic-html-cheat-sheet`,
      `${productionUrl}/learn/beginner-javascript-practice`,
    ]);
  });

  it.each([
    "/dashboard",
    "/profile",
    "/interview/javascript-fundamentals",
    "/playground",
    "/projects/semantic-html-article",
    "/settings",
    "/certificate",
  ])("excludes the private route %s", (privateRoute) => {
    expect(sitemap().map(({ url }) => url)).not.toContain(
      `${productionUrl}${privateRoute}`,
    );
  });
});

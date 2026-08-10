import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";

const productionUrl = "https://lovable-original-eight.vercel.app";

describe("public sitemap", () => {
  it("preserves the current public discovery routes and ordering", () => {
    expect(sitemap().map(({ url }) => url)).toEqual([
      productionUrl,
      `${productionUrl}/about`,
      `${productionUrl}/courses/web-development-foundations`,
      `${productionUrl}/learn/web-development-foundations/css-selectors-box-model`,
      `${productionUrl}/practice`,
      `${productionUrl}/learn/semantic-html`,
      `${productionUrl}/learn/why-use-semantic-html`,
      `${productionUrl}/learn/semantic-html-project`,
      `${productionUrl}/learn/semantic-html-cheat-sheet`,
      `${productionUrl}/learn/beginner-javascript-practice`,
      `${productionUrl}/learn/what-is-the-css-box-model`,
      `${productionUrl}/learn/how-to-practice-javascript`,
    ]);
  });

  it.each([
    "/dashboard",
    "/profile",
    "/interview/javascript-fundamentals",
    "/playground",
    "/practice/mixed-review",
    "/projects",
    "/projects/semantic-html-article",
    "/projects/javascript-expense-report",
    "/projects/html-css-resource-library",
    "/projects/html-css-resource-library/debrief",
    "/settings",
    "/certificate",
  ])("excludes the private route %s", (privateRoute) => {
    expect(sitemap().map(({ url }) => url)).not.toContain(
      `${productionUrl}${privateRoute}`,
    );
  });
});

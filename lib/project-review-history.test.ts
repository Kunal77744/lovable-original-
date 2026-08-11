import { describe, expect, it } from "vitest";
import {
  getProjectReviewDefinition,
  isProjectReviewStatus,
} from "./project-review-history";

describe("project review history definitions", () => {
  it("maps each saved project to its exact private route and six-check rubric", () => {
    expect(getProjectReviewDefinition("semantic-html-article")).toMatchObject({
      stack: "Semantic HTML",
      href: "/projects/semantic-html-article",
      totalChecks: 6,
    });
    expect(
      getProjectReviewDefinition("javascript-expense-report"),
    ).toMatchObject({
      stack: "JavaScript",
      href: "/projects/javascript-expense-report",
      totalChecks: 6,
    });
    expect(
      getProjectReviewDefinition("html-css-resource-library"),
    ).toMatchObject({
      stack: "HTML + CSS",
      href: "/projects/html-css-resource-library",
      totalChecks: 6,
    });
  });

  it("rejects unknown projects and unbounded statuses", () => {
    expect(getProjectReviewDefinition("unknown-project")).toBeNull();
    expect(isProjectReviewStatus("completed")).toBe(true);
    expect(isProjectReviewStatus("needs-revision")).toBe(true);
    expect(isProjectReviewStatus("draft")).toBe(false);
  });
});

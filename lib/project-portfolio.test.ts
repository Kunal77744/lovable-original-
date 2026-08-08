import { describe, expect, it } from "vitest";
import { buildProjectPortfolio } from "./project-portfolio";

const notStarted = { state: "not-started" as const, passedChecks: 0 };
const completed = { state: "completed" as const, passedChecks: 6 };

function build(
  overrides: Partial<Parameters<typeof buildProjectPortfolio>[0]> = {},
) {
  return buildProjectPortfolio({
    courseCompleted: false,
    courseNextHref:
      "/learn/web-development-foundations/css-selectors-box-model",
    courseNextTitle: "Style a card without guessing",
    cssCompletedCount: 0,
    cssTotalCount: 6,
    cssNextHref: "/practice/css/class-selector",
    semanticHtml: notStarted,
    javascript: notStarted,
    htmlCss: notStarted,
    ...overrides,
  });
}

describe("buildProjectPortfolio", () => {
  it("guides a fresh learner through the course without unlocking gated projects", () => {
    const portfolio = build();

    expect(portfolio.primaryAction).toMatchObject({
      href: "/learn/web-development-foundations/css-selectors-box-model",
      label: "Continue the course",
    });
    expect(portfolio.projects[0]).toMatchObject({
      href: null,
      lockedReason: "Available after Web Development Foundations",
    });
    expect(portfolio.projects[2]).toMatchObject({
      href: null,
      lockedReason: "Available after 6 CSS challenges",
    });
  });

  it("resumes saved work before offering a new project", () => {
    const portfolio = build({
      courseCompleted: true,
      semanticHtml: completed,
      javascript: { state: "in-progress", passedChecks: 4 },
      htmlCss: completed,
      cssCompletedCount: 6,
    });

    expect(portfolio.primaryAction).toMatchObject({
      href: "/projects/javascript-expense-report",
      label: "Resume JavaScript project",
    });
    expect(portfolio.primaryAction.description).toContain("4/6 checks passed");
    expect(portfolio.completedCount).toBe(2);
  });

  it("points a learner to the exact CSS prerequisite when it is the only lock left", () => {
    const portfolio = build({
      courseCompleted: true,
      semanticHtml: completed,
      javascript: completed,
      cssCompletedCount: 4,
      cssNextHref: "/practice/css/margin",
    });

    expect(portfolio.primaryAction).toMatchObject({
      href: "/practice/css/margin",
      label: "Continue CSS practice",
    });
  });

  it("makes the newest debrief the next action after all projects are complete", () => {
    const portfolio = build({
      courseCompleted: true,
      semanticHtml: completed,
      javascript: completed,
      htmlCss: completed,
      cssCompletedCount: 6,
    });

    expect(portfolio.primaryAction).toMatchObject({
      href: "/projects/html-css-resource-library/debrief",
      label: "Review the latest debrief",
    });
    expect(portfolio.completedCount).toBe(3);
  });
});

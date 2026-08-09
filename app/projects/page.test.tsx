import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProjectsPage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  getCourse: vi.fn(),
  getCssPractice: vi.fn(),
  getGuidedProject: vi.fn(),
  getJavaScriptCapstone: vi.fn(),
  getJavaScriptLabs: vi.fn(),
  getHtmlCssCapstone: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/db/course", () => ({
  getFirstCourseProgressSummary: mocks.getCourse,
}));

vi.mock("@/db/css-practice", () => ({
  getCssPracticeCatalogProgress: mocks.getCssPractice,
}));

vi.mock("@/db/guided-project", () => ({
  getGuidedProjectSummary: mocks.getGuidedProject,
}));

vi.mock("@/db/javascript-capstone", () => ({
  getJavaScriptCapstoneSummary: mocks.getJavaScriptCapstone,
}));

vi.mock("@/db/javascript-lab-progress", () => ({
  getJavaScriptLabCatalogProgress: mocks.getJavaScriptLabs,
}));

vi.mock("@/db/html-css-capstone", () => ({
  getHtmlCssCapstoneSummary: mocks.getHtmlCssCapstone,
}));

const notStarted = { state: "not-started", passedChecks: 0 };

describe("ProjectsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: "learner-1" } });
    mocks.getCourse.mockResolvedValue({
      slug: "web-development-foundations",
      courseCompleted: false,
      nextLesson: {
        slug: "css-selectors-box-model",
        title: "Style a card without guessing",
      },
    });
    mocks.getCssPractice.mockResolvedValue({
      completedCount: 0,
      totalCount: 6,
      completedSlugs: [],
      nextChallengeSlug: "class-selector",
    });
    mocks.getGuidedProject.mockResolvedValue(notStarted);
    mocks.getJavaScriptCapstone.mockResolvedValue(notStarted);
    mocks.getJavaScriptLabs.mockResolvedValue({
      completedCount: 0,
      totalCount: 55,
      nextLabSlug: "foundations",
      nextLabTitle: "JavaScript foundations",
      nextHref: "/practice/judge-basics",
      nextExerciseNumber: 1,
      labs: [],
    });
    mocks.getHtmlCssCapstone.mockResolvedValue(notStarted);
  });

  afterEach(() => cleanup());

  it("keeps the private project record out of search and names no public identity", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(JSON.stringify(metadata)).not.toMatch(/public portfolio|profile URL/i);
  });

  it("redirects before reading any account-owned project state", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(ProjectsPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin",
    );
    expect(mocks.getCourse).not.toHaveBeenCalled();
    expect(mocks.getCssPractice).not.toHaveBeenCalled();
    expect(mocks.getGuidedProject).not.toHaveBeenCalled();
    expect(mocks.getJavaScriptCapstone).not.toHaveBeenCalled();
    expect(mocks.getJavaScriptLabs).not.toHaveBeenCalled();
    expect(mocks.getHtmlCssCapstone).not.toHaveBeenCalled();
  });

  it("shows one course action and honest project locks for a fresh learner", async () => {
    render(await ProjectsPage());

    expect(
      screen.getByRole("heading", {
        name: "Three projects. One record of what you can build.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Continue the course/ }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/css-selectors-box-model",
    );
    expect(
      screen.getByText("Available after Web Development Foundations"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Available after 6 CSS challenges"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Available after 55 guided JavaScript steps"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Continue exercise 1/ }),
    ).toHaveAttribute("href", "/practice/judge-basics");
    expect(
      document.querySelectorAll(".project-portfolio-primary-action"),
    ).toHaveLength(1);
  });

  it("resumes the saved project and exposes only bounded account summaries", async () => {
    mocks.getCourse.mockResolvedValue({
      slug: "web-development-foundations",
      courseCompleted: true,
      nextLesson: {
        slug: "css-selectors-box-model",
        title: "Style a card without guessing",
      },
    });
    mocks.getCssPractice.mockResolvedValue({
      completedCount: 6,
      totalCount: 6,
      completedSlugs: ["one", "two", "three", "four", "five", "six"],
      nextChallengeSlug: null,
    });
    mocks.getGuidedProject.mockResolvedValue({
      state: "completed",
      passedChecks: 6,
      html: "PRIVATE SEMANTIC HTML",
    });
    mocks.getJavaScriptCapstone.mockResolvedValue({
      state: "in-progress",
      passedChecks: 4,
      code: "PRIVATE JAVASCRIPT",
    });
    mocks.getHtmlCssCapstone.mockResolvedValue({
      state: "completed",
      passedChecks: 6,
      css: "PRIVATE CSS",
    });
    mocks.getJavaScriptLabs.mockResolvedValue({
      completedCount: 12,
      totalCount: 55,
      nextLabSlug: "test-design",
      nextLabTitle: "Test design",
      nextHref: "/practice/test-design?exercise=1",
      nextExerciseNumber: 1,
      labs: [],
    });

    render(await ProjectsPage());

    expect(
      screen.getByRole("link", { name: /Resume JavaScript project/ }),
    ).toHaveAttribute("href", "/projects/javascript-expense-report");
    expect(screen.getByText("4/6 checks passed")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open private debrief" }),
    ).toHaveAttribute(
      "href",
      "/projects/html-css-resource-library/debrief",
    );
    expect(document.body).not.toHaveTextContent("PRIVATE SEMANTIC HTML");
    expect(document.body).not.toHaveTextContent("PRIVATE JAVASCRIPT");
    expect(document.body).not.toHaveTextContent("PRIVATE CSS");
    expect(mocks.getGuidedProject).toHaveBeenCalledWith(
      "learner-1",
      "semantic-html-article",
    );
    expect(mocks.getJavaScriptCapstone).toHaveBeenCalledWith("learner-1");
    expect(mocks.getJavaScriptLabs).toHaveBeenCalledWith("learner-1");
    expect(mocks.getHtmlCssCapstone).toHaveBeenCalledWith("learner-1");
  });
});

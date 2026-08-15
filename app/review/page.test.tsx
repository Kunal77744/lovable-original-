import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReviewPage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  getCourse: vi.fn(),
  getPractice: vi.fn(),
  getCodingMistakes: vi.fn(),
  getCodingBookmarks: vi.fn(),
  getAttempts: vi.fn(),
  getCssPractice: vi.fn(),
  getCssReview: vi.fn(),
  getLabPractice: vi.fn(),
  getProject: vi.fn(),
  getHtmlCssCapstone: vi.fn(),
  getJavaScriptCapstone: vi.fn(),
  getWebFoundationsResult: vi.fn(),
  getJavaScriptMixedResult: vi.fn(),
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
  getOrCreateFirstCourseAssignment: mocks.getCourse,
}));

vi.mock("@/db/coding-practice", () => ({
  getCodingCatalogProgress: mocks.getPractice,
  getCodingMistakeReviewQueueForStudent: mocks.getCodingMistakes,
  getCodingProblemBookmarksForStudent: mocks.getCodingBookmarks,
  getRecentCodingAttempts: mocks.getAttempts,
}));

vi.mock("@/db/css-practice", () => ({
  getCssPracticeCatalogProgress: mocks.getCssPractice,
  getCssReviewSessionForStudent: mocks.getCssReview,
}));

vi.mock("@/db/javascript-lab-progress", () => ({
  getJavaScriptLabCatalogProgress: mocks.getLabPractice,
}));

vi.mock("@/db/guided-project", () => ({
  getGuidedProjectForStudent: mocks.getProject,
}));

vi.mock("@/db/html-css-capstone", () => ({
  getHtmlCssCapstoneSummary: mocks.getHtmlCssCapstone,
}));

vi.mock("@/db/javascript-capstone", () => ({
  getJavaScriptCapstoneSummary: mocks.getJavaScriptCapstone,
}));

vi.mock("@/db/web-foundations-review", () => ({
  getWebFoundationsReviewResultForStudent: mocks.getWebFoundationsResult,
}));

vi.mock("@/db/javascript-mixed-review", () => ({
  getJavaScriptMixedReviewResultForStudent: mocks.getJavaScriptMixedResult,
}));

describe("ReviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCourse.mockResolvedValue({
      slug: "web-development-foundations",
      title: "Web Development Foundations",
      completedLessons: 1,
      totalLessons: 3,
      progressPercent: 33,
      courseCompleted: false,
      nextLesson: {
        slug: "style-a-card-with-css",
        title: "Style a card without guessing",
        moduleTitle: "CSS foundations",
        completed: false,
        quizScore: null,
      },
    });
    mocks.getPractice.mockResolvedValue({
      completedCount: 0,
      totalCount: 12,
      completedSlugs: [],
    });
    mocks.getCodingMistakes.mockResolvedValue([]);
    mocks.getCodingBookmarks.mockResolvedValue([]);
    mocks.getAttempts.mockResolvedValue([]);
    mocks.getCssPractice.mockResolvedValue({
      completedCount: 0,
      totalCount: 6,
      completedSlugs: [],
    });
    mocks.getCssReview.mockResolvedValue([]);
    mocks.getLabPractice.mockResolvedValue({
      completedCount: 0,
      totalCount: 55,
      nextLabSlug: "foundations",
      nextLabTitle: "JavaScript foundations",
      nextHref: "/practice/foundations",
      nextExerciseNumber: 1,
      labs: [],
    });
    mocks.getProject.mockResolvedValue({ submission: null });
    mocks.getHtmlCssCapstone.mockResolvedValue({
      state: "not-started",
      passedChecks: 0,
    });
    mocks.getJavaScriptCapstone.mockResolvedValue({
      state: "not-started",
      passedChecks: 0,
    });
    mocks.getWebFoundationsResult.mockResolvedValue(null);
    mocks.getJavaScriptMixedResult.mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps the private hub out of search results", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(JSON.stringify(metadata)).toContain("Your private review");
  });

  it("redirects signed-out visitors to the exact route before private reads", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(ReviewPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin&next=%2Freview",
    );
    expect(mocks.getCourse).not.toHaveBeenCalled();
    expect(mocks.getCodingMistakes).not.toHaveBeenCalled();
    expect(mocks.getCssReview).not.toHaveBeenCalled();
    expect(mocks.getWebFoundationsResult).not.toHaveBeenCalled();
  });

  it("keeps the exact unfinished activity primary when no review is ready", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "learner-1" } });

    render(await ReviewPage());

    expect(
      screen.getByRole("heading", { name: "Nothing needs review right now." }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("0 reviews ready now"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Start the course/ }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/style-a-card-with-css",
    );
    expect(mocks.getCourse).toHaveBeenCalledWith("learner-1");
    expect(mocks.getCssReview).toHaveBeenCalledWith("learner-1");
  });

  it("makes due Foundations recall primary without displacing forward progress", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "learner-1" } });
    mocks.getCourse.mockResolvedValue({
      slug: "web-development-foundations",
      title: "Web Development Foundations",
      completedLessons: 3,
      totalLessons: 3,
      progressPercent: 100,
      courseCompleted: true,
      nextLesson: {
        slug: "responsive-css-grid",
        title: "Build a layout that adapts",
        moduleTitle: "Responsive layouts",
        completed: true,
        quizScore: 100,
      },
    });

    render(await ReviewPage());

    expect(
      screen.getByRole("heading", {
        name: "Your next review is already chosen.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Start Foundations review/ }),
    ).toHaveAttribute("href", "/courses/web-development-foundations/review");
    expect(
      screen.getByRole("link", { name: /Build the field guide/ }),
    ).toHaveAttribute("href", "/projects/semantic-html-article");
  });
});

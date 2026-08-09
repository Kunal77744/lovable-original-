import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CODING_PROBLEMS } from "@/lib/coding-problems";
import DashboardPage from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getCourse: vi.fn(),
  getPractice: vi.fn(),
  getCssPractice: vi.fn(),
  getProject: vi.fn(),
  getHtmlCssCapstone: vi.fn(),
  getJavaScriptLabProgress: vi.fn(),
  getJavaScriptCapstone: vi.fn(),
  getFoundationsReview: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/db/course", () => ({
  getOrCreateFirstCourseAssignment: mocks.getCourse,
}));

vi.mock("@/db/coding-practice", () => ({
  getCodingCatalogProgress: mocks.getPractice,
}));

vi.mock("@/db/css-practice", () => ({
  getCssPracticeCatalogProgress: mocks.getCssPractice,
}));

vi.mock("@/db/guided-project", () => ({
  getGuidedProjectForStudent: mocks.getProject,
}));

vi.mock("@/db/html-css-capstone", () => ({
  getHtmlCssCapstoneSummary: mocks.getHtmlCssCapstone,
}));

vi.mock("@/db/javascript-lab-progress", () => ({
  getJavaScriptLabCatalogProgress: mocks.getJavaScriptLabProgress,
}));

vi.mock("@/db/javascript-capstone", () => ({
  getJavaScriptCapstoneSummary: mocks.getJavaScriptCapstone,
}));

vi.mock("@/db/web-foundations-review", () => ({
  getWebFoundationsReviewResultForStudent: mocks.getFoundationsReview,
}));

vi.mock("@/components/sign-out-button", () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

describe("DashboardPage", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: {
        id: "learner-1",
        name: "Verification Learner",
        email: "learner@example.com",
      },
    });
    mocks.getHtmlCssCapstone.mockResolvedValue({
      state: "not-started",
      passedChecks: 0,
    });
    mocks.getJavaScriptLabProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 55,
      nextLabSlug: "foundations",
      nextLabTitle: "JavaScript foundations",
      nextHref: "/practice/judge-basics",
      nextExerciseNumber: 1,
      labs: [
        {
          slug: "foundations",
          title: "JavaScript foundations",
          href: "/practice/judge-basics",
          completedCount: 0,
          totalCount: 4,
          nextExerciseNumber: 1,
          state: "not-started",
        },
      ],
    });
    mocks.getJavaScriptCapstone.mockResolvedValue({
      state: "not-started",
      passedChecks: 0,
    });
    mocks.getFoundationsReview.mockResolvedValue(null);
    mocks.getCourse.mockResolvedValue({
      slug: "web-development-foundations",
      title: "Web Development Foundations",
      description: "Build and save a semantic HTML article.",
      completedLessons: 0,
      totalLessons: 3,
      progressPercent: 0,
      courseCompleted: false,
      lessons: [
        {
          slug: "semantic-html",
          title: "Build a page the browser understands",
          estimatedMinutes: 18,
          completed: false,
          quizScore: null,
        },
        {
          slug: "css-selectors-box-model",
          title: "Style a card without guessing",
          estimatedMinutes: 16,
          completed: false,
          quizScore: null,
        },
        {
          slug: "responsive-css-grid",
          title: "Build a layout that adapts",
          estimatedMinutes: 17,
          completed: false,
          quizScore: null,
        },
      ],
      nextLesson: {
        slug: "semantic-html",
        title: "Build a page the browser understands",
        description: "Build the structure of a readable article.",
        moduleTitle: "HTML foundations",
        estimatedMinutes: 18,
        completed: false,
        quizScore: null,
      },
    });
    mocks.getPractice.mockResolvedValue({
      completedCount: 0,
      totalCount: CODING_PROBLEMS.length,
      completedSlugs: [],
    });
    mocks.getCssPractice.mockResolvedValue({
      completedCount: 0,
      totalCount: 6,
      completedSlugs: [],
      nextChallengeSlug: "class-selector",
    });
    mocks.getProject.mockResolvedValue({
      submission: null,
    });
  });

  it("gives a fresh learner one primary start action and previews the full path", async () => {
    render(await DashboardPage());

    expect(
      screen.getByRole("link", { name: "Start the first lesson" }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/semantic-html",
    );
    expect(
      screen.getByRole("link", { name: "View learning record" }),
    ).toHaveAttribute("href", "/profile");
    expect(
      screen.queryByRole("link", { name: "Build the field guide" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Start problem 01" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Solve problem 01: Sum two numbers",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("0/6")).toBeInTheDocument();
    expect(screen.getByText("Start here · 51 minutes")).toBeInTheDocument();
  });

  it("continues an HTML completer to the exact CSS lesson", async () => {
    mocks.getCourse.mockResolvedValue({
      ...(await mocks.getCourse()),
      completedLessons: 1,
      progressPercent: 33,
      nextLesson: {
        slug: "css-selectors-box-model",
        title: "Style a card without guessing",
        description: "Style a predictable learning card.",
        moduleTitle: "CSS foundations",
        estimatedMinutes: 16,
        completed: false,
        quizScore: null,
      },
    });

    render(await DashboardPage());

    expect(
      screen.getByRole("link", {
        name: "Continue to Style a card without guessing",
      }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/css-selectors-box-model",
    );
    expect(screen.getByText("1/3 lessons complete")).toBeInTheDocument();
  });

  it("continues a CSS foundations completer to responsive layout", async () => {
    mocks.getCourse.mockResolvedValue({
      ...(await mocks.getCourse()),
      completedLessons: 2,
      progressPercent: 67,
      nextLesson: {
        slug: "responsive-css-grid",
        title: "Build a layout that adapts",
        description: "Build a resource grid that responds to available space.",
        moduleTitle: "Responsive layout",
        estimatedMinutes: 17,
        completed: false,
        quizScore: null,
      },
    });

    render(await DashboardPage());

    expect(
      screen.getByRole("link", {
        name: "Continue to Build a layout that adapts",
      }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/responsive-css-grid",
    );
    expect(screen.getByText("2/3 lessons complete")).toBeInTheDocument();
  });

  it("resumes a saved field guide after course completion", async () => {
    mocks.getCourse.mockResolvedValue({
      ...(await mocks.getCourse()),
      completedLessons: 3,
      progressPercent: 100,
      courseCompleted: true,
      nextLesson: {
        slug: "css-selectors-box-model",
        title: "Style a card without guessing",
        description: "Style a predictable learning card.",
        moduleTitle: "CSS foundations",
        estimatedMinutes: 16,
        completed: true,
        quizScore: 100,
      },
    });
    mocks.getProject.mockResolvedValue({
      saved: true,
      submission: null,
    });

    render(await DashboardPage());

    expect(
      screen.getByRole("link", { name: "Continue the field guide" }),
    ).toHaveAttribute("href", "/projects/semantic-html-article");
    expect(screen.getByText("Saved draft ready")).toBeInTheDocument();
    expect(screen.getByText("1/6")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Review due concepts" }),
    ).toHaveAttribute("href", "/courses/web-development-foundations/review");
  });

  it("points a returning learner to the exact next unfinished problem", async () => {
    mocks.getCourse.mockResolvedValue({
      ...(await mocks.getCourse()),
      completedLessons: 3,
      progressPercent: 100,
      courseCompleted: true,
      nextLesson: {
        slug: "css-selectors-box-model",
        title: "Style a card without guessing",
        description: "Style a predictable learning card.",
        moduleTitle: "CSS foundations",
        estimatedMinutes: 16,
        completed: true,
        quizScore: 100,
      },
    });
    mocks.getProject.mockResolvedValue({
      saved: true,
      submission: {
        status: "completed",
        passedChecks: 6,
        totalChecks: 6,
      },
    });
    mocks.getPractice.mockResolvedValue({
      completedCount: 1,
      totalCount: CODING_PROBLEMS.length,
      completedSlugs: ["sum-two-numbers"],
    });

    render(await DashboardPage());

    expect(
      screen.getByRole("heading", {
        name: "Solve problem 02: Even or odd",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue at problem 02" }),
    ).toHaveAttribute("href", "/practice/even-or-odd");
    expect(screen.getByText("1/12 Accepted")).toBeInTheDocument();
    expect(screen.getByText("2/6")).toBeInTheDocument();
  });

  it("resumes foundations before problem 01 after project completion", async () => {
    mocks.getCourse.mockResolvedValue({
      ...(await mocks.getCourse()),
      completedLessons: 3,
      progressPercent: 100,
      courseCompleted: true,
      nextLesson: {
        slug: "css-selectors-box-model",
        title: "Style a card without guessing",
        description: "Style a predictable learning card.",
        moduleTitle: "CSS foundations",
        estimatedMinutes: 16,
        completed: true,
        quizScore: 100,
      },
    });
    mocks.getProject.mockResolvedValue({
      saved: true,
      submission: {
        status: "completed",
        passedChecks: 6,
        totalChecks: 6,
      },
    });
    mocks.getJavaScriptLabProgress.mockResolvedValue({
      completedCount: 2,
      totalCount: 55,
      nextLabSlug: "foundations",
      nextLabTitle: "JavaScript foundations",
      nextHref: "/practice/foundations",
      nextExerciseNumber: 3,
      labs: [
        {
          slug: "foundations",
          title: "JavaScript foundations",
          href: "/practice/foundations",
          completedCount: 2,
          totalCount: 4,
          nextExerciseNumber: 3,
          state: "in-progress",
        },
      ],
    });

    render(await DashboardPage());

    expect(
      screen.getByRole("link", {
        name: "Continue foundations · step 3 of 4",
      }),
    ).toHaveAttribute("href", "/practice/foundations");
    expect(screen.getByText("2/4 foundations steps saved")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Start problem 01" }),
    ).not.toBeInTheDocument();
  });

  it("continues a JavaScript completer into the exact next CSS challenge", async () => {
    mocks.getCourse.mockResolvedValue({
      ...(await mocks.getCourse()),
      completedLessons: 3,
      progressPercent: 100,
      courseCompleted: true,
      nextLesson: {
        slug: "css-selectors-box-model",
        title: "Style a card without guessing",
        description: "Style a predictable learning card.",
        moduleTitle: "CSS foundations",
        estimatedMinutes: 16,
        completed: true,
        quizScore: 100,
      },
    });
    mocks.getProject.mockResolvedValue({
      saved: true,
      submission: {
        status: "completed",
        passedChecks: 6,
        totalChecks: 6,
      },
    });
    mocks.getPractice.mockResolvedValue({
      completedCount: CODING_PROBLEMS.length,
      totalCount: CODING_PROBLEMS.length,
      completedSlugs: CODING_PROBLEMS.map((problem) => problem.slug),
    });
    mocks.getCssPractice.mockResolvedValue({
      completedCount: 2,
      totalCount: 6,
      completedSlugs: ["class-selector", "descendant-selector"],
      nextChallengeSlug: "predictable-width",
    });

    render(await DashboardPage());

    expect(
      screen.getByRole("heading", {
        name: "Complete CSS 03: Keep the width predictable",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue at CSS 03" }),
    ).toHaveAttribute("href", "/practice/css/predictable-width");
    expect(screen.getByText("Completed · 12/12 Accepted")).toBeInTheDocument();
    expect(screen.getByText("3/6")).toBeInTheDocument();
  });

  it("continues a main-path completer at the exact unfinished guided JavaScript exercise", async () => {
    mocks.getCourse.mockResolvedValue({
      ...(await mocks.getCourse()),
      completedLessons: 3,
      progressPercent: 100,
      courseCompleted: true,
      nextLesson: {
        slug: "css-selectors-box-model",
        title: "Style a card without guessing",
        description: "Style a predictable learning card.",
        moduleTitle: "CSS foundations",
        estimatedMinutes: 16,
        completed: true,
        quizScore: 100,
      },
    });
    mocks.getProject.mockResolvedValue({
      saved: true,
      submission: { status: "completed", passedChecks: 6, totalChecks: 6 },
    });
    mocks.getPractice.mockResolvedValue({
      completedCount: CODING_PROBLEMS.length,
      totalCount: CODING_PROBLEMS.length,
      completedSlugs: CODING_PROBLEMS.map((problem) => problem.slug),
    });
    mocks.getCssPractice.mockResolvedValue({
      completedCount: 6,
      totalCount: 6,
      completedSlugs: [
        "class-selector",
        "descendant-selector",
        "predictable-width",
        "content-box",
        "grid-columns",
        "grid-gap",
      ],
      nextChallengeSlug: null,
    });
    mocks.getHtmlCssCapstone.mockResolvedValue({
      state: "completed",
      passedChecks: 6,
    });
    mocks.getJavaScriptLabProgress.mockResolvedValue({
      completedCount: 12,
      totalCount: 55,
      nextLabSlug: "tracing",
      nextLabTitle: "Code tracing",
      nextHref: "/practice/tracing",
      nextExerciseNumber: 3,
      labs: [],
    });

    render(await DashboardPage());

    expect(screen.getByText("5/6")).toBeInTheDocument();
    expect(screen.getByText("12/55 guided steps saved")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Code tracing" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue exercise 3" }),
    ).toHaveAttribute("href", "/practice/tracing");
    expect(
      screen.queryByText(/without replacing the 12 judged/i),
    ).not.toBeInTheDocument();
  });

  it("opens the JavaScript capstone after all guided steps are saved", async () => {
    mocks.getCourse.mockResolvedValue({
      ...(await mocks.getCourse()),
      completedLessons: 3,
      progressPercent: 100,
      courseCompleted: true,
      nextLesson: {
        slug: "css-selectors-box-model",
        title: "Style a card without guessing",
        description: "Style a predictable learning card.",
        moduleTitle: "CSS foundations",
        estimatedMinutes: 16,
        completed: true,
        quizScore: 100,
      },
    });
    mocks.getProject.mockResolvedValue({
      saved: true,
      submission: { status: "completed", passedChecks: 6, totalChecks: 6 },
    });
    mocks.getPractice.mockResolvedValue({
      completedCount: CODING_PROBLEMS.length,
      totalCount: CODING_PROBLEMS.length,
      completedSlugs: CODING_PROBLEMS.map((problem) => problem.slug),
    });
    mocks.getCssPractice.mockResolvedValue({
      completedCount: 6,
      totalCount: 6,
      completedSlugs: [
        "class-selector",
        "descendant-selector",
        "predictable-width",
        "content-box",
        "grid-columns",
        "grid-gap",
      ],
      nextChallengeSlug: null,
    });
    mocks.getHtmlCssCapstone.mockResolvedValue({
      state: "completed",
      passedChecks: 6,
    });
    mocks.getJavaScriptLabProgress.mockResolvedValue({
      completedCount: 55,
      totalCount: 55,
      nextLabSlug: null,
      nextLabTitle: null,
      nextHref: "/practice/foundations",
      nextExerciseNumber: null,
      labs: [],
    });
    mocks.getJavaScriptCapstone.mockResolvedValue({
      state: "in-progress",
      passedChecks: 4,
    });

    render(await DashboardPage());

    expect(screen.getByText("5/6")).toBeInTheDocument();
    expect(
      screen.getByText("Guided practice saved · 4/6 capstone outcomes passing"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Resume the JavaScript capstone" }),
    ).toHaveAttribute("href", "/projects/javascript-expense-report");
  });
});

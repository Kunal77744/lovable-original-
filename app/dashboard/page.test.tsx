import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getCourse: vi.fn(),
  getPractice: vi.fn(),
  getProject: vi.fn(),
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

vi.mock("@/db/guided-project", () => ({
  getGuidedProjectForStudent: mocks.getProject,
}));

vi.mock("@/components/sign-out-button", () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: {
        id: "learner-1",
        name: "Verification Learner",
        email: "learner@example.com",
      },
    });
    mocks.getCourse.mockResolvedValue({
      slug: "web-development-foundations",
      title: "Web Development Foundations",
      description: "Build and save a semantic HTML article.",
      completedLessons: 0,
      totalLessons: 1,
      progressPercent: 0,
      courseCompleted: false,
      nextLesson: {
        slug: "semantic-html",
        title: "Structure a page with semantic HTML",
        description: "Build the structure of a readable article.",
        moduleTitle: "HTML foundations",
        completed: false,
        quizScore: null,
      },
    });
    mocks.getPractice.mockResolvedValue({
      completedCount: 0,
      totalCount: 6,
      completedSlugs: [],
    });
    mocks.getProject.mockResolvedValue({
      submission: null,
    });
  });

  it("gives a fresh learner one primary start action and previews the full path", async () => {
    render(await DashboardPage());

    expect(
      screen.getByRole("link", { name: "Start the lesson" }),
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
    expect(screen.getByText("0/3")).toBeInTheDocument();
  });

  it("resumes a saved field guide after course completion", async () => {
    mocks.getCourse.mockResolvedValue({
      ...(await mocks.getCourse()),
      completedLessons: 1,
      progressPercent: 100,
      courseCompleted: true,
      nextLesson: {
        slug: "semantic-html",
        title: "Structure a page with semantic HTML",
        description: "Build the structure of a readable article.",
        moduleTitle: "HTML foundations",
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
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });

  it("points a returning learner to the exact next unfinished problem", async () => {
    mocks.getCourse.mockResolvedValue({
      ...(await mocks.getCourse()),
      completedLessons: 1,
      progressPercent: 100,
      courseCompleted: true,
      nextLesson: {
        slug: "semantic-html",
        title: "Structure a page with semantic HTML",
        description: "Build the structure of a readable article.",
        moduleTitle: "HTML foundations",
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
      totalCount: 6,
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
    expect(screen.getByText("1/6 Accepted")).toBeInTheDocument();
    expect(screen.getByText("2/3")).toBeInTheDocument();
  });
});

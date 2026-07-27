import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getCourse: vi.fn(),
  getPractice: vi.fn(),
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
  });

  it("keeps the course action primary and adds one-click private progress access", async () => {
    render(await DashboardPage());

    expect(
      screen.getByRole("link", { name: "Start lesson" }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/semantic-html",
    );
    expect(
      screen.getByRole("link", { name: "View private progress" }),
    ).toHaveAttribute("href", "/profile");
  });
});

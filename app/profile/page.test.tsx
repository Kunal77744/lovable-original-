import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfilePage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  getCourse: vi.fn(),
  getPractice: vi.fn(),
  getAttempts: vi.fn(),
  getProject: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
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
  getRecentCodingAttempts: mocks.getAttempts,
}));

vi.mock("@/db/guided-project", () => ({
  getGuidedProjectForStudent: mocks.getProject,
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCourse.mockResolvedValue({
      slug: "web-development-foundations",
      title: "Web Development Foundations",
      completedLessons: 0,
      totalLessons: 1,
      progressPercent: 0,
      courseCompleted: false,
      nextLesson: {
        slug: "semantic-html",
        title: "Structure a page with semantic HTML",
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
    mocks.getAttempts.mockResolvedValue([]);
    mocks.getProject.mockResolvedValue({
      submission: null,
    });
  });

  it("describes saved progress as private account activity", () => {
    const preview = JSON.stringify(metadata);

    expect(preview).toContain("Your private course and practice progress");
    expect(preview).toContain("saved course progress");
    expect(preview).toContain("accepted JavaScript problems");
    expect(preview).toContain("private account view");
    expect(preview).not.toMatch(/public profile|rankings?|social/i);
  });

  it("keeps the private profile out of search results and link discovery", () => {
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
    });
  });

  it("redirects a signed-out visitor before reading private progress", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(ProfilePage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin",
    );
    expect(mocks.getCourse).not.toHaveBeenCalled();
    expect(mocks.getPractice).not.toHaveBeenCalled();
    expect(mocks.getAttempts).not.toHaveBeenCalled();
    expect(mocks.getProject).not.toHaveBeenCalled();
  });

  it("loads only the signed-in learner's account-backed record", async () => {
    mocks.getSession.mockResolvedValue({
      user: {
        id: "learner-1",
        name: "Verification Learner",
        email: "private@example.com",
      },
    });

    render(await ProfilePage());

    expect(
      screen.getByRole("heading", {
        name: "Your learning record starts here.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("0/1")).toBeInTheDocument();
    expect(
      screen.getByText("problems accepted").parentElement,
    ).toHaveTextContent("0/6");
    expect(screen.getByText("Not started")).toBeInTheDocument();
    expect(mocks.getCourse).toHaveBeenCalledWith("learner-1");
    expect(mocks.getPractice).toHaveBeenCalledWith("learner-1");
    expect(mocks.getAttempts).toHaveBeenCalledWith("learner-1");
    expect(mocks.getProject).toHaveBeenCalledWith(
      "learner-1",
      "semantic-html-article",
    );
    expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Start the course/ }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/semantic-html",
    );
  });

  it("routes a completed learner into an unfinished private project", async () => {
    mocks.getSession.mockResolvedValue({
      user: {
        id: "learner-1",
        name: "Verification Learner",
        email: "private@example.com",
      },
    });
    mocks.getCourse.mockResolvedValue({
      slug: "web-development-foundations",
      title: "Web Development Foundations",
      completedLessons: 1,
      totalLessons: 1,
      progressPercent: 100,
      courseCompleted: true,
      nextLesson: {
        slug: "semantic-html",
        title: "Structure a page with semantic HTML",
        moduleTitle: "HTML foundations",
        completed: true,
        quizScore: 100,
      },
    });

    render(await ProfilePage());

    expect(
      screen.getByRole("link", { name: "Build the field guide" }),
    ).toHaveAttribute("href", "/projects/semantic-html-article");
  });
});

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CourseNotesPage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getCourseNotes: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
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
  getFirstCourseNotesForStudent: mocks.getCourseNotes,
}));

const courseNotes = {
  slug: "web-development-foundations",
  title: "Web Development Foundations",
  completedLessons: 1,
  totalLessons: 3,
  progressPercent: 33,
  courseCompleted: false,
  nextLesson: {
    id: "lesson-2",
    slug: "css-selectors-box-model",
    title: "Style a readable profile card",
    description: "Use selectors and the box model.",
    moduleTitle: "Module 2",
    position: 2,
    estimatedMinutes: 17,
    completed: false,
    quizScore: null,
  },
  lessons: [
    {
      id: "lesson-1",
      slug: "semantic-html",
      title: "Build a semantic HTML article",
      description: "Give a page a useful structure.",
      moduleTitle: "Module 1",
      position: 1,
      estimatedMinutes: 18,
      completed: true,
      quizScore: 100,
      note: {
        content: "A landmark names the purpose of a region.",
        updatedAt: "2026-08-17T08:30:00.000Z",
      },
    },
    {
      id: "lesson-2",
      slug: "css-selectors-box-model",
      title: "Style a readable profile card",
      description: "Use selectors and the box model.",
      moduleTitle: "Module 2",
      position: 2,
      estimatedMinutes: 17,
      completed: false,
      quizScore: null,
      note: null,
    },
    {
      id: "lesson-3",
      slug: "responsive-css-grid",
      title: "Build a responsive layout",
      description: "Make a layout adapt.",
      moduleTitle: "Module 3",
      position: 3,
      estimatedMinutes: 16,
      completed: false,
      quizScore: null,
      note: {
        content: "Grid changes tracks; media queries change decisions.",
        updatedAt: "2026-08-17T08:45:00.000Z",
      },
    },
  ],
};

describe("CourseNotesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCourseNotes.mockResolvedValue(courseNotes);
  });

  afterEach(cleanup);

  it("keeps the account-scoped notebook out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("redirects to exact account continuation before reading private notes", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(CourseNotesPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin&next=%2Fcourses%2Fweb-development-foundations%2Fnotes",
    );
    expect(mocks.getCourseNotes).not.toHaveBeenCalled();
  });

  it("shows only the signed-in learner's notes and exact next lesson", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "learner-1", email: "private@example.com" },
    });

    render(await CourseNotesPage());

    expect(mocks.getCourseNotes).toHaveBeenCalledWith("learner-1");
    expect(
      screen.getByRole("heading", { name: "Keep the ideas worth returning to." }),
    ).toBeInTheDocument();
    expect(screen.getByText("A landmark names the purpose of a region.")).toBeInTheDocument();
    expect(
      screen.getByText("Grid changes tracks; media queries change decisions."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("No note yet")).toHaveLength(1);
    expect(screen.getByRole("link", { name: /continue lesson 2/i })).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/css-selectors-box-model",
    );
    expect(screen.getByRole("link", { name: /write a lesson note/i })).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/css-selectors-box-model#lesson-notes",
    );
    expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
  });

  it("turns a completed course back into the existing review", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "learner-1" } });
    mocks.getCourseNotes.mockResolvedValue({
      ...courseNotes,
      completedLessons: 3,
      progressPercent: 100,
      courseCompleted: true,
      nextLesson: null,
    });

    render(await CourseNotesPage());

    expect(screen.getByRole("link", { name: /open course review/i })).toHaveAttribute(
      "href",
      "/courses/web-development-foundations/review",
    );
  });
});

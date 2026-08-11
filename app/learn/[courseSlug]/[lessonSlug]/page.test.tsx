import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCourseFeedbackForStudent,
  getFirstCourseLessonForStudent,
  getFirstLessonArtifact,
  getFirstLessonNote,
  getLessonReadingProgressForStudent,
} from "@/db/course";
import { auth } from "@/lib/auth";
import {
  FIRST_COURSE,
  FIRST_COURSE_LESSONS,
  SECOND_LESSON,
  THIRD_LESSON,
} from "@/lib/first-course-content";
import LessonPage, { generateMetadata } from "./page";

const captureLearnerEventOnce = vi.hoisted(() => vi.fn());

vi.mock("@/lib/product-analytics", () => ({
  captureLearnerEventOnce,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/db/course", () => ({
  getCourseFeedbackForStudent: vi.fn(),
  getFirstCourseLessonForStudent: vi.fn(),
  getFirstLessonArtifact: vi.fn(),
  getFirstLessonNote: vi.fn(),
  getLessonReadingProgressForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getStudentLesson = vi.mocked(getFirstCourseLessonForStudent);
const getArtifact = vi.mocked(getFirstLessonArtifact);
const getNote = vi.mocked(getFirstLessonNote);
const getFeedback = vi.mocked(getCourseFeedbackForStudent);
const getReadingProgress = vi.mocked(getLessonReadingProgressForStudent);

describe("public lesson access", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue(null);
    captureLearnerEventOnce.mockReset();
  });

  it("renders the complete authored lesson without loading private learner data", async () => {
    render(
      await LessonPage({
        params: Promise.resolve({
          courseSlug: "web-development-foundations",
          lessonSlug: "semantic-html",
        }),
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Build a page the browser understands",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Structure is meaning before it is styling.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Choose elements by purpose, not appearance.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Build a heading outline someone can scan.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Build an accessible article page.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { name: "Check your mental model." }),
    ).not.toHaveLength(0);
    expect(screen.getByText("Full lesson · Free to read")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Answer from memory. You can choose all four answers before deciding whether to check them.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/wrong attempt is saved as progress/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Student sign in" }),
    ).toHaveAttribute("href", "/account");
    expect(
      screen.queryByRole("link", { name: "Create account" }),
    ).not.toBeInTheDocument();

    expect(getStudentLesson).not.toHaveBeenCalled();
    expect(getArtifact).not.toHaveBeenCalled();
    expect(getNote).not.toHaveBeenCalled();
    expect(getFeedback).not.toHaveBeenCalled();
    expect(getReadingProgress).not.toHaveBeenCalled();
  });

  it("describes the CSS lesson accurately in search and sharing metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({
        courseSlug: "web-development-foundations",
        lessonSlug: "css-selectors-box-model",
      }),
    });

    expect(metadata.title).toBe(
      "Style a card without guessing | Lovable Original",
    );
    expect(metadata.description).toBe(
      "Use CSS selectors and the box model to style a predictable learning card, then return to your saved practice after sign-in.",
    );
    expect(metadata.openGraph?.description).toBe(metadata.description);
    expect(metadata.twitter?.description).toBe(metadata.description);
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renders the complete responsive CSS lesson without private reads", async () => {
    render(
      await LessonPage({
        params: Promise.resolve({
          courseSlug: "web-development-foundations",
          lessonSlug: "responsive-css-grid",
        }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Build a layout that adapts" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Layout describes a relationship, not a screen size.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Make one resource grid adapt." }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { name: "Check your mental model." }),
    ).not.toHaveLength(0);
    expect(getStudentLesson).not.toHaveBeenCalled();
    expect(getArtifact).not.toHaveBeenCalled();
    expect(getNote).not.toHaveBeenCalled();
    expect(getReadingProgress).not.toHaveBeenCalled();
  });

  it.each([SECOND_LESSON, THIRD_LESSON])(
    "restores the signed-in learner's private note in $title",
    async (lesson) => {
      getSession.mockResolvedValue({
        user: { id: "learner-1" },
      } as Awaited<ReturnType<typeof auth.api.getSession>>);
      getStudentLesson.mockResolvedValue({
        courseSlug: FIRST_COURSE.slug,
        courseTitle: FIRST_COURSE.title,
        lessonId: lesson.id,
        lessonSlug: lesson.slug,
        lessonTitle: lesson.title,
        lessonDescription: lesson.description,
        moduleTitle: lesson.moduleTitle,
        position: lesson.position,
        estimatedMinutes: lesson.estimatedMinutes,
        completed: false,
        quizScore: null,
        completedLessons: 0,
        totalLessons: FIRST_COURSE_LESSONS.length,
        progressPercent: 0,
        courseCompleted: false,
        nextLesson: null,
        lessons: FIRST_COURSE_LESSONS.map((courseLesson) => ({
          ...courseLesson,
          completed: false,
          quizScore: null,
        })),
      });
      getArtifact.mockResolvedValue({
        html: "",
        checks: [],
        saved: true,
        updatedAt: "2026-08-09T20:00:00.000Z",
        submission: null,
      });
      getNote.mockResolvedValue({
        note: {
          content: `My note for ${lesson.title}.`,
          updatedAt: "2026-08-09T20:00:00.000Z",
        },
      });
      getFeedback.mockResolvedValue({ feedback: null });
      getReadingProgress.mockResolvedValue({ furthestSection: 0 });

      render(
        await LessonPage({
          params: Promise.resolve({
            courseSlug: FIRST_COURSE.slug,
            lessonSlug: lesson.slug,
          }),
        }),
      );

      expect(getNote).toHaveBeenCalledWith("learner-1", lesson.slug);
      expect(
        screen.getByDisplayValue(`My note for ${lesson.title}.`),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Your saved note is back. Revise it whenever your understanding changes.",
        ),
      ).toBeInTheDocument();
    },
  );

  it("records an anonymous lesson start from the stable founder-warm entry", async () => {
    render(
      await LessonPage({
        params: Promise.resolve({
          courseSlug: "web-development-foundations",
          lessonSlug: "semantic-html",
        }),
        searchParams: Promise.resolve({ entry_source: "founder_warm" }),
      }),
    );

    expect(captureLearnerEventOnce).toHaveBeenCalledWith("lesson_started", {
      course_slug: "web-development-foundations",
      lesson_slug: "semantic-html",
      entry_source: "founder_warm",
    });
    expect(getStudentLesson).not.toHaveBeenCalled();
    expect(getArtifact).not.toHaveBeenCalled();
    expect(getNote).not.toHaveBeenCalled();
    expect(getFeedback).not.toHaveBeenCalled();
    expect(getReadingProgress).not.toHaveBeenCalled();
  });
});

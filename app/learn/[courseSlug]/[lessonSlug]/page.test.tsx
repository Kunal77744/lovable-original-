import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCourseFeedbackForStudent,
  getFirstCourseLessonForStudent,
  getFirstLessonArtifact,
  getFirstLessonNote,
} from "@/db/course";
import { auth } from "@/lib/auth";
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
}));

const getSession = vi.mocked(auth.api.getSession);
const getStudentLesson = vi.mocked(getFirstCourseLessonForStudent);
const getArtifact = vi.mocked(getFirstLessonArtifact);
const getNote = vi.mocked(getFirstLessonNote);
const getFeedback = vi.mocked(getCourseFeedbackForStudent);

describe("public lesson access", () => {
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
      screen.getByRole("heading", { name: "Check your mental model." }),
    ).toBeInTheDocument();
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
  });
});

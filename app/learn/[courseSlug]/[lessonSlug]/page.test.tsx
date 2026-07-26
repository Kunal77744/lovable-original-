import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getFirstCourseLessonForStudent: vi.fn(),
  getCourseFeedbackForStudent: vi.fn(),
  getFirstLessonArtifact: vi.fn(),
  getFirstLessonNote: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("not found");
  }),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/db/course", () => ({
  getFirstCourseLessonForStudent: mocks.getFirstCourseLessonForStudent,
  getCourseFeedbackForStudent: mocks.getCourseFeedbackForStudent,
  getFirstLessonArtifact: mocks.getFirstLessonArtifact,
  getFirstLessonNote: mocks.getFirstLessonNote,
}));

import LessonPage from "./page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("public lesson access", () => {
  it("opens the real lesson while signed out without reading private data", async () => {
    mocks.getSession.mockResolvedValue(null);

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
        name: /build a page the browser understands/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /structure is meaning before it is styling/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /create a free account to save/i,
      }),
    ).toHaveAttribute("href", "/account");
    expect(
      screen.getByRole("link", {
        name: /student sign in/i,
      }),
    ).toHaveAttribute("href", "/account");
    expect(
      screen.getByText(/a private place to return to/i),
    ).toBeInTheDocument();

    expect(mocks.getFirstCourseLessonForStudent).not.toHaveBeenCalled();
    expect(mocks.getFirstLessonArtifact).not.toHaveBeenCalled();
    expect(mocks.getFirstLessonNote).not.toHaveBeenCalled();
    expect(mocks.getCourseFeedbackForStudent).not.toHaveBeenCalled();
  });
});

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { getOrCreateFirstCourseAssignment } from "@/db/course";
import { getWebFoundationsReviewResultForStudent } from "@/db/web-foundations-review";
import { auth } from "@/lib/auth";
import WebFoundationsReviewPage, { metadata } from "./page";

vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue(new Headers()) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/db/course", () => ({ getOrCreateFirstCourseAssignment: vi.fn() }));
vi.mock("@/db/web-foundations-review", () => ({
  getWebFoundationsReviewResultForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getCourse = vi.mocked(getOrCreateFirstCourseAssignment);
const getReview = vi.mocked(getWebFoundationsReviewResultForStudent);

const course = {
  slug: "web-development-foundations",
  title: "Web Development Foundations",
  description: "Learn HTML and CSS",
  status: "published",
  completedLessons: 2,
  totalLessons: 2,
  progressPercent: 100,
  courseCompleted: true,
  lessons: [],
  nextLesson: null,
} as Awaited<ReturnType<typeof getOrCreateFirstCourseAssignment>>;

describe("WebFoundationsReviewPage", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    getReview.mockResolvedValue(null);
  });

  it("redirects before reading private course state when signed out", async () => {
    getSession.mockResolvedValue(null);
    expect(await WebFoundationsReviewPage()).toBeNull();
    expect(redirect).toHaveBeenCalledWith(
      "/account?mode=signin&next=/courses/web-development-foundations/review",
    );
    expect(getCourse).not.toHaveBeenCalled();
    expect(getReview).not.toHaveBeenCalled();
  });

  it("shows the four-concept private review after course completion", async () => {
    getSession.mockResolvedValue({ user: { id: "learner" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    getCourse.mockResolvedValue(course);
    render(await WebFoundationsReviewPage());

    expect(screen.getByRole("heading", {
      name: "Bring HTML and CSS foundations back before you build.",
    })).toBeInTheDocument();
    expect(screen.getByText("4 lesson concepts")).toBeInTheDocument();
    expect(screen.getByText("Concept 1 of 4")).toBeInTheDocument();
  });

  it("restores the saved result before the next due date", async () => {
    getSession.mockResolvedValue({ user: { id: "learner" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    getCourse.mockResolvedValue(course);
    getReview.mockResolvedValue({
      correctCount: 3,
      totalCount: 4,
      completedAt: "2026-08-07T12:00:00.000Z",
      nextDueAt: "2126-08-14T12:00:00.000Z",
    });
    render(await WebFoundationsReviewPage());

    expect(screen.getByRole("heading", {
      name: "Your next foundations review is set for Aug 14.",
    })).toBeInTheDocument();
    expect(screen.getByText("Last recall 3/4. Only the result and due date are saved.")).toBeInTheDocument();
  });

  it("is private and excluded from indexing", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

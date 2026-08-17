import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { getCodingCatalogProgress } from "@/db/coding-practice";
import { getOrCreateFirstCourseAssignment } from "@/db/course";
import { getCssPracticeCatalogProgress } from "@/db/css-practice";
import { getGuidedProjectSummary } from "@/db/guided-project";
import { getHtmlCssCapstoneSummary } from "@/db/html-css-capstone";
import { getJavaScriptCapstoneSummary } from "@/db/javascript-capstone";
import { getJavaScriptLabCatalogProgress } from "@/db/javascript-lab-progress";
import { getWebFoundationsReviewResultForStudent } from "@/db/web-foundations-review";
import { auth } from "@/lib/auth";
import WebFoundationsReviewPage, { metadata } from "./page";

vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue(new Headers()) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/db/course", () => ({ getOrCreateFirstCourseAssignment: vi.fn() }));
vi.mock("@/db/coding-practice", () => ({ getCodingCatalogProgress: vi.fn() }));
vi.mock("@/db/css-practice", () => ({ getCssPracticeCatalogProgress: vi.fn() }));
vi.mock("@/db/guided-project", () => ({ getGuidedProjectSummary: vi.fn() }));
vi.mock("@/db/html-css-capstone", () => ({ getHtmlCssCapstoneSummary: vi.fn() }));
vi.mock("@/db/javascript-capstone", () => ({ getJavaScriptCapstoneSummary: vi.fn() }));
vi.mock("@/db/javascript-lab-progress", () => ({
  getJavaScriptLabCatalogProgress: vi.fn(),
}));
vi.mock("@/db/web-foundations-review", () => ({
  getWebFoundationsReviewResultForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getCourse = vi.mocked(getOrCreateFirstCourseAssignment);
const getReview = vi.mocked(getWebFoundationsReviewResultForStudent);
const getPractice = vi.mocked(getCodingCatalogProgress);
const getCssPractice = vi.mocked(getCssPracticeCatalogProgress);
const getProject = vi.mocked(getGuidedProjectSummary);
const getHtmlCssCapstone = vi.mocked(getHtmlCssCapstoneSummary);
const getJavaScriptCapstone = vi.mocked(getJavaScriptCapstoneSummary);
const getLabPractice = vi.mocked(getJavaScriptLabCatalogProgress);

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
    getPractice.mockResolvedValue({
      completedCount: 0,
      totalCount: 12,
      completedSlugs: [],
    });
    getCssPractice.mockResolvedValue({
      completedCount: 0,
      totalCount: 6,
      completedSlugs: [],
      nextChallengeSlug: "selector-targeting",
    });
    getProject.mockResolvedValue({ state: "not-started", passedChecks: 0 });
    getHtmlCssCapstone.mockResolvedValue({
      state: "not-started",
      passedChecks: 0,
    });
    getJavaScriptCapstone.mockResolvedValue({
      state: "not-started",
      passedChecks: 0,
    });
    getLabPractice.mockResolvedValue({
      completedCount: 0,
      totalCount: 55,
      nextLabSlug: "foundations",
      nextLabTitle: "JavaScript foundations",
      nextHref: "/practice/foundations",
      nextExerciseNumber: 1,
      labs: [],
    });
  });

  it("redirects before reading private course state when signed out", async () => {
    getSession.mockResolvedValue(null);
    expect(await WebFoundationsReviewPage()).toBeNull();
    expect(redirect).toHaveBeenCalledWith(
      "/account?mode=signin&next=/courses/web-development-foundations/review",
    );
    expect(getCourse).not.toHaveBeenCalled();
    expect(getReview).not.toHaveBeenCalled();
    expect(getPractice).not.toHaveBeenCalled();
    expect(getCssPractice).not.toHaveBeenCalled();
    expect(getProject).not.toHaveBeenCalled();
    expect(getHtmlCssCapstone).not.toHaveBeenCalled();
    expect(getJavaScriptCapstone).not.toHaveBeenCalled();
    expect(getLabPractice).not.toHaveBeenCalled();
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

  it("continues a returning learner at the exact next unfinished activity", async () => {
    getSession.mockResolvedValue({ user: { id: "learner" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    getCourse.mockResolvedValue(course);
    getProject.mockResolvedValue({ state: "completed", passedChecks: 6 });
    getLabPractice.mockResolvedValue({
      completedCount: 55,
      totalCount: 55,
      nextLabSlug: null,
      nextLabTitle: null,
      nextHref: "/practice",
      nextExerciseNumber: null,
      labs: [],
    });
    getPractice.mockResolvedValue({
      completedCount: 2,
      totalCount: 12,
      completedSlugs: ["sum-two-numbers", "even-or-odd"],
    });
    getReview.mockResolvedValue({
      correctCount: 4,
      totalCount: 4,
      completedAt: "2026-08-07T12:00:00.000Z",
      nextDueAt: "2126-08-14T12:00:00.000Z",
    });

    render(await WebFoundationsReviewPage());

    expect(
      screen.getByRole("link", { name: "Solve problem 03" }),
    ).toHaveAttribute("href", "/practice/multiplication-table");
    expect(
      screen.queryByRole("link", { name: "Build the field guide" }),
    ).not.toBeInTheDocument();
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

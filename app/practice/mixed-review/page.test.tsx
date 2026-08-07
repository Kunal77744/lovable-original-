import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getJavaScriptLabCatalogProgress } from "@/db/javascript-lab-progress";
import { getJavaScriptMixedReviewResultForStudent } from "@/db/javascript-mixed-review";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import JavaScriptMixedReviewPage, { metadata } from "./page";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/db/javascript-lab-progress", () => ({
  getJavaScriptLabCatalogProgress: vi.fn(),
}));
vi.mock("@/db/javascript-mixed-review", () => ({
  getJavaScriptMixedReviewResultForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getLabProgress = vi.mocked(getJavaScriptLabCatalogProgress);
const getMixedReviewResult = vi.mocked(
  getJavaScriptMixedReviewResultForStudent,
);
const redirectMock = vi.mocked(redirect);

describe("JavaScriptMixedReviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMixedReviewResult.mockResolvedValue(null);
  });

  it("redirects before reading private progress when signed out", async () => {
    getSession.mockResolvedValue(null);

    expect(await JavaScriptMixedReviewPage()).toBeNull();
    expect(redirectMock).toHaveBeenCalledWith(
      "/account?mode=signin&next=/practice/mixed-review",
    );
    expect(getLabProgress).not.toHaveBeenCalled();
    expect(getMixedReviewResult).not.toHaveBeenCalled();
  });

  it("uses completed lab progress and keeps the exact unfinished route available", async () => {
    getSession.mockResolvedValue({ user: { id: "learner" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    getLabProgress.mockResolvedValue({
      completedCount: 2,
      totalCount: 55,
      nextLabSlug: "debugging",
      nextLabTitle: "Debugging",
      nextHref: "/practice/debugging?exercise=2",
      nextExerciseNumber: 2,
      labs: [
        { slug: "foundations", title: "Foundations", href: "/practice/foundations", completedCount: 4, totalCount: 4, nextExerciseNumber: null, state: "complete" },
        { slug: "tracing", title: "Tracing", href: "/practice/tracing", completedCount: 4, totalCount: 4, nextExerciseNumber: null, state: "complete" },
        { slug: "debugging", title: "Debugging", href: "/practice/debugging", completedCount: 1, totalCount: 4, nextExerciseNumber: 2, state: "in-progress" },
      ],
    });

    render(await JavaScriptMixedReviewPage());

    expect(screen.getByRole("heading", { name: "Complete three labs first." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue guided JavaScript" })).toHaveAttribute(
      "href",
      "/practice/debugging?exercise=2",
    );
    expect(getLabProgress).toHaveBeenCalledWith("learner");
    expect(getMixedReviewResult).toHaveBeenCalledWith("learner");
  });

  it("restores the private result before its next due date", async () => {
    getSession.mockResolvedValue({ user: { id: "learner" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    getLabProgress.mockResolvedValue({
      completedCount: 12,
      totalCount: 55,
      nextLabSlug: "test-design",
      nextLabTitle: "Test design",
      nextHref: "/practice/test-design?exercise=1",
      nextExerciseNumber: 1,
      labs: [
        { slug: "foundations", title: "Foundations", href: "/practice/foundations", completedCount: 4, totalCount: 4, nextExerciseNumber: null, state: "complete" },
        { slug: "tracing", title: "Tracing", href: "/practice/tracing", completedCount: 4, totalCount: 4, nextExerciseNumber: null, state: "complete" },
        { slug: "debugging", title: "Debugging", href: "/practice/debugging", completedCount: 4, totalCount: 4, nextExerciseNumber: null, state: "complete" },
        { slug: "test-design", title: "Test design", href: "/practice/test-design", completedCount: 0, totalCount: 4, nextExerciseNumber: 1, state: "not-started" },
      ],
    });
    getMixedReviewResult.mockResolvedValue({
      correctCount: 3,
      totalCount: 4,
      completedAt: "2026-08-07T12:00:00.000Z",
      nextDueAt: "2126-08-14T12:00:00.000Z",
    });

    render(await JavaScriptMixedReviewPage());

    expect(
      screen.getByRole("heading", {
        name: "Your next mixed review is set for Aug 14.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Last recall 3/4. Only the result and due date are saved.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue Test design, exercise 1" }),
    ).toHaveAttribute("href", "/practice/test-design?exercise=1");
  });

  it("is private and excluded from indexing", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

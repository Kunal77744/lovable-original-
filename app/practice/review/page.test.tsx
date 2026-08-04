import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PracticeReviewPage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getMistakes: vi.fn(),
  getBookmarks: vi.fn(),
  getProgress: vi.fn(),
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

vi.mock("@/db/coding-practice", () => ({
  getCodingMistakeReviewQueueForStudent: mocks.getMistakes,
  getCodingProblemBookmarksForStudent: mocks.getBookmarks,
  getCodingCatalogProgress: mocks.getProgress,
}));

describe("PracticeReviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getMistakes.mockResolvedValue([]);
    mocks.getBookmarks.mockResolvedValue([]);
    mocks.getProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 6,
      completedSlugs: [],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps the private review route out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("redirects before reading private review data when signed out", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(PracticeReviewPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin",
    );
    expect(mocks.getMistakes).not.toHaveBeenCalled();
    expect(mocks.getBookmarks).not.toHaveBeenCalled();
    expect(mocks.getProgress).not.toHaveBeenCalled();
  });

  it("builds a bounded account-scoped session with mistakes first", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "learner-a", email: "private@example.com" },
    });
    mocks.getMistakes.mockResolvedValue([
      {
        slug: "largest-value",
        number: 4,
        title: "Largest value",
        skill: "Arrays",
        concept: "Compare only the data values",
        recoveryHint: "Test an all-negative list.",
        passedTests: 3,
        totalTests: 4,
        attemptedAt: "2026-08-04T09:00:00.000Z",
      },
    ]);
    mocks.getBookmarks.mockResolvedValue([
      {
        slug: "largest-value",
        number: 4,
        title: "Largest value",
        skill: "Arrays",
      },
      {
        slug: "reverse-a-word",
        number: 5,
        title: "Reverse a word",
        skill: "Strings",
      },
    ]);
    mocks.getProgress.mockResolvedValue({
      completedCount: 1,
      totalCount: 6,
      completedSlugs: ["reverse-a-word"],
    });

    render(await PracticeReviewPage());

    expect(mocks.getMistakes).toHaveBeenCalledWith("learner-a");
    expect(mocks.getBookmarks).toHaveBeenCalledWith("learner-a");
    expect(mocks.getProgress).toHaveBeenCalledWith("learner-a");
    expect(screen.getByLabelText("2 review problems")).toHaveTextContent("2problemsMaximum 3");
    expect(
      screen.getByRole("link", { name: "Start this review" }),
    ).toHaveAttribute("href", "/practice/largest-value");
    expect(
      screen.getByRole("link", { name: "Open problem" }),
    ).toHaveAttribute("href", "/practice/reverse-a-word");
    expect(screen.getByText("Unresolved mistake")).toBeInTheDocument();
    expect(
      screen.getByText("Accepted before · saved for later"),
    ).toBeInTheDocument();
    expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
  });

  it("shows a truthful empty state before any review item exists", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "fresh-learner" } });

    render(await PracticeReviewPage());

    expect(
      screen.getByRole("heading", {
        name: "Your first weak spot will appear here.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to JavaScript practice" }),
    ).toHaveAttribute("href", "/practice");
  });

  it("shows a completed state when the full path has no saved weak spots", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "complete-learner" } });
    mocks.getProgress.mockResolvedValue({
      completedCount: 6,
      totalCount: 6,
      completedSlugs: [
        "sum-two-numbers",
        "even-or-odd",
        "multiplication-table",
        "largest-value",
        "reverse-a-word",
        "fizz-buzz",
      ],
    });

    render(await PracticeReviewPage());

    expect(
      screen.getByRole("heading", {
        name: "Your saved review session is clear.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Review complete")).toBeInTheDocument();
  });
});

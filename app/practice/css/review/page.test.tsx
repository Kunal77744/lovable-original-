import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CssReviewPage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getReviewSession: vi.fn(),
  getProgress: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/db/css-practice", () => ({
  getCssReviewSessionForStudent: mocks.getReviewSession,
  getCssPracticeCatalogProgress: mocks.getProgress,
}));

describe("CssReviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getReviewSession.mockResolvedValue([]);
    mocks.getProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 6,
      completedSlugs: [],
      nextChallengeSlug: "class-selector",
    });
  });

  afterEach(() => cleanup());

  it("keeps the private review route out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("redirects before reading private CSS results when signed out", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(CssReviewPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin&next=%2Fpractice%2Fcss%2Freview",
    );
    expect(mocks.getReviewSession).not.toHaveBeenCalled();
    expect(mocks.getProgress).not.toHaveBeenCalled();
  });

  it("shows a bounded account-scoped review session", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "learner-a", email: "private@example.com" },
    });
    mocks.getReviewSession.mockResolvedValue([
      {
        slug: "descendant-selector",
        number: 2,
        title: "Scope the lesson count",
        skill: "Descendant selectors",
        outcome: "The lesson count becomes green and bold.",
        passedChecks: 2,
        totalChecks: 3,
        attemptedAt: "2026-08-04T12:00:00.000Z",
      },
      {
        slug: "predictable-width",
        number: 3,
        title: "Keep the width predictable",
        skill: "Box sizing",
        outcome: "The card stays 280px wide.",
        passedChecks: 3,
        totalChecks: 4,
        attemptedAt: "2026-08-04T11:00:00.000Z",
      },
    ]);

    render(await CssReviewPage());

    expect(mocks.getReviewSession).toHaveBeenCalledWith("learner-a");
    expect(screen.getByLabelText("2 CSS review challenges")).toHaveTextContent(
      "2challengesMaximum 3",
    );
    expect(
      screen.getByRole("link", { name: "Start this review" }),
    ).toHaveAttribute(
      "href",
      "/practice/css/descendant-selector?review=1",
    );
    expect(
      screen.getByRole("link", { name: "Open challenge" }),
    ).toHaveAttribute(
      "href",
      "/practice/css/predictable-width?review=1",
    );
    expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
  });

  it("shows a truthful clear state after all six challenges pass", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "complete-learner" } });
    mocks.getProgress.mockResolvedValue({
      completedCount: 6,
      totalCount: 6,
      completedSlugs: [],
      nextChallengeSlug: null,
    });

    render(await CssReviewPage());

    expect(
      screen.getByRole("heading", { name: "Your saved CSS review is clear." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Review complete")).toBeInTheDocument();
  });
});

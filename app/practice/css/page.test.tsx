import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CssPracticePage from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getProgress: vi.fn(),
  getReviewSession: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/db/css-practice", () => ({
  getCssPracticeCatalogProgress: mocks.getProgress,
  getCssReviewSessionForStudent: mocks.getReviewSession,
}));

describe("CssPracticePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 6,
      completedSlugs: [],
      nextChallengeSlug: "class-selector",
    });
    mocks.getReviewSession.mockResolvedValue([]);
  });

  afterEach(() => cleanup());

  it("shows the private CSS review entry only to signed-in learners", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "learner-a" } });
    mocks.getReviewSession.mockResolvedValue([
      {
        slug: "class-selector",
        number: 1,
        title: "Select one card",
        skill: "Class selectors",
        outcome: "Only the learning card changes.",
        passedChecks: 2,
        totalChecks: 3,
        attemptedAt: "2026-08-05T00:00:00.000Z",
      },
    ]);

    render(await CssPracticePage());

    expect(mocks.getReviewSession).toHaveBeenCalledWith("learner-a");
    expect(
      screen.getByRole("link", { name: "Open CSS review" }),
    ).toHaveAttribute("href", "/practice/css/review");
    expect(document.querySelector(".practice-review-entry")).toHaveTextContent(
      "1 challenge",
    );
  });

  it("does not read or show private review results while signed out", async () => {
    mocks.getSession.mockResolvedValue(null);

    render(await CssPracticePage());

    expect(mocks.getReviewSession).not.toHaveBeenCalled();
    expect(screen.queryByText("Private CSS review")).not.toBeInTheDocument();
  });
});

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CssChallengePage from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getStudentState: vi.fn(),
  getProgress: vi.fn(),
  getFeedback: vi.fn(),
  workspace: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/db/css-practice", () => ({
  getCssPracticeChallengeForStudent: mocks.getStudentState,
  getCssPracticeCatalogProgress: mocks.getProgress,
  getCssPracticePathFeedbackForStudent: mocks.getFeedback,
}));

vi.mock("@/components/css-challenge-workspace", () => ({
  CssChallengeWorkspace: (props: {
    hasSavedDraft: boolean;
    isReviewSession: boolean;
  }) => {
    mocks.workspace(props);
    return (
      <div data-testid="workspace">
        {props.isReviewSession ? "review context" : "normal context"}
      </div>
    );
  },
}));

describe("CssChallengePage review context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getStudentState.mockResolvedValue({
      css: ".learning-card {}",
      hasSavedDraft: false,
      bestVerdict: "Needs revision",
      attempts: [],
    });
    mocks.getProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 6,
      completedSlugs: [],
      nextChallengeSlug: "class-selector",
    });
    mocks.getFeedback.mockResolvedValue({ isEligible: false, feedback: null });
  });

  afterEach(() => cleanup());

  it("keeps signed-in review context on the exact CSS challenge", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "learner-a" } });

    render(
      await CssChallengePage({
        params: Promise.resolve({ challengeSlug: "class-selector" }),
        searchParams: Promise.resolve({ review: "1" }),
      }),
    );

    expect(
      screen.getByRole("link", { name: "Private CSS review" }),
    ).toHaveAttribute("href", "/practice/css/review");
    expect(screen.getByTestId("workspace")).toHaveTextContent(
      "review context",
    );
    expect(mocks.workspace).toHaveBeenCalledWith(
      expect.objectContaining({
        hasSavedDraft: false,
        isReviewSession: true,
        isSignedIn: true,
      }),
    );
  });

  it("passes the account-backed draft fact into the workspace", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "learner-a" } });
    mocks.getStudentState.mockResolvedValue({
      css: ".learning-card { color: #287652; }",
      hasSavedDraft: true,
      bestVerdict: null,
      attempts: [],
    });

    render(
      await CssChallengePage({
        params: Promise.resolve({ challengeSlug: "class-selector" }),
      }),
    );

    expect(mocks.workspace).toHaveBeenCalledWith(
      expect.objectContaining({ hasSavedDraft: true, isSignedIn: true }),
    );
  });

  it("does not expose private review context while signed out", async () => {
    mocks.getSession.mockResolvedValue(null);

    render(
      await CssChallengePage({
        params: Promise.resolve({ challengeSlug: "class-selector" }),
        searchParams: Promise.resolve({ review: "1" }),
      }),
    );

    expect(screen.getByRole("link", { name: "CSS practice" })).toHaveAttribute(
      "href",
      "/practice/css",
    );
    expect(screen.queryByText("Private CSS review")).not.toBeInTheDocument();
    expect(mocks.getFeedback).not.toHaveBeenCalled();
    expect(mocks.workspace).toHaveBeenCalledWith(
      expect.objectContaining({ isReviewSession: false, isSignedIn: false }),
    );
  });
});

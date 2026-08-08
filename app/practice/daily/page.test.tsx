import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDailyCodingChallenge } from "@/lib/daily-coding-challenge";
import DailyCodingChallengePage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  getCompletion: vi.fn(),
  getProgress: vi.fn(),
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

vi.mock("@/db/daily-coding-challenge", () => ({
  getDailyCodingChallengeCompletionForStudent: mocks.getCompletion,
}));

vi.mock("@/db/coding-practice", () => ({
  getCodingCatalogProgress: mocks.getProgress,
}));

describe("DailyCodingChallengePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-08T14:30:00.000Z"));
    mocks.getCompletion.mockResolvedValue(null);
    mocks.getProgress.mockResolvedValue({
      completedCount: 1,
      totalCount: 12,
      completedSlugs: ["sum-two-numbers"],
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("keeps the private route out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("redirects signed-out visitors before private reads", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(DailyCodingChallengePage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin&next=%2Fpractice%2Fdaily",
    );
    expect(mocks.getCompletion).not.toHaveBeenCalled();
    expect(mocks.getProgress).not.toHaveBeenCalled();
  });

  it("shows the UTC-selected problem without displacing normal continuation", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "daily-learner" } });
    const challenge = getDailyCodingChallenge();

    render(await DailyCodingChallengePage());

    expect(
      screen.getByRole("heading", { name: "One focused problem for today." }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: challenge.title })).toBeVisible();
    expect(screen.getByText("Not completed yet.")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Start today’s problem" }),
    ).toHaveAttribute(
      "href",
      `/practice/${challenge.slug}?daily=2026-08-08`,
    );
    expect(
      screen.getByRole("link", { name: "Continue at problem 02" }),
    ).toHaveAttribute("href", "/practice/even-or-odd");
    expect(mocks.getCompletion).toHaveBeenCalledWith(
      "daily-learner",
      "2026-08-08",
    );
  });

  it("shows a saved completed-today state without implying a streak", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "daily-returner" } });
    const challenge = getDailyCodingChallenge();
    mocks.getCompletion.mockResolvedValue({
      challengeDate: "2026-08-08",
      problemSlug: challenge.slug,
      submissionId: "accepted-daily-submission",
      completedAt: "2026-08-08T09:00:00.000Z",
    });

    render(await DailyCodingChallengePage());

    expect(screen.getByText("Completed today")).toBeVisible();
    expect(screen.getByText("Accepted and saved to your account.")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Review today’s problem" }),
    ).toHaveAttribute(
      "href",
      `/practice/${challenge.slug}?daily=2026-08-08`,
    );
    expect(screen.queryByText(/streak/i)).not.toBeInTheDocument();
  });
});

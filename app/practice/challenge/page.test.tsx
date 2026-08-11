import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCodingCatalogProgress } from "@/db/coding-practice";
import { getRecentTimedCodingChallengeResultsForStudent } from "@/db/timed-coding-challenge";
import { auth } from "@/lib/auth";
import TimedCodingChallengePage, { metadata } from "./page";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/db/coding-practice", () => ({
  getCodingCatalogProgress: vi.fn(),
}));

vi.mock("@/db/timed-coding-challenge", () => ({
  getRecentTimedCodingChallengeResultsForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getProgress = vi.mocked(getCodingCatalogProgress);
const getRecentResults = vi.mocked(
  getRecentTimedCodingChallengeResultsForStudent,
);

describe("TimedCodingChallengePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    getRecentResults.mockResolvedValue([]);
  });

  afterEach(cleanup);

  it("shows four stable sets and the exact next unfinished action", async () => {
    getSession.mockResolvedValue({
      user: { id: "challenge-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
      completedCount: 2,
      totalCount: 12,
      completedSlugs: ["sum-two-numbers", "even-or-odd"],
    });

    render(await TimedCodingChallengePage({}));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Core path. Thirty focused minutes.",
      }),
    ).toBeVisible();
    expect(screen.getByText("Choose a three-problem set.")).toBeVisible();
    expect(screen.getAllByText("Accepted 1 of 3")).toHaveLength(3);
    expect(screen.getByText("Accepted 2 of 12")).toBeVisible();
    expect(screen.getAllByRole("link", { name: /Set \d{2}/ })).toHaveLength(4);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(
      screen.getByRole("link", { name: "Open Largest value" }),
    ).toHaveAttribute("href", "/practice/largest-value");
    expect(screen.getByText("Next problem")).toBeVisible();
    expect(getProgress).toHaveBeenCalledWith("challenge-learner");
    expect(getRecentResults).toHaveBeenCalledWith("challenge-learner");
  });

  it("opens an explicitly selected set at its exact saved continuation", async () => {
    getSession.mockResolvedValue({
      user: { id: "returning-challenge-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
      completedCount: 4,
      totalCount: 12,
      completedSlugs: [
        "even-or-odd",
        "largest-value",
        "fizz-buzz",
        "count-vowels",
      ],
    });

    render(
      await TimedCodingChallengePage({
        searchParams: Promise.resolve({ set: "collections" }),
      }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Collections. Thirty focused minutes.",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Open Keep unique values" }),
    ).toHaveAttribute("href", "/practice/unique-values");
    expect(
      screen.getByRole("link", { name: /Set 03Collections/ }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("redirects signed-out visitors before reading private progress or history", async () => {
    getSession.mockResolvedValue(null);

    await expect(
      TimedCodingChallengePage({
        searchParams: Promise.resolve({ set: "collections" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(getProgress).not.toHaveBeenCalled();
    expect(getRecentResults).not.toHaveBeenCalled();
  });

  it("keeps the account-only challenge out of search", () => {
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
    });
  });

  it("recovers recent private results for only the signed-in account", async () => {
    getSession.mockResolvedValue({
      user: { id: "returning-timed-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
      completedCount: 2,
      totalCount: 12,
      completedSlugs: ["count-vowels", "unique-values"],
    });
    getRecentResults.mockResolvedValue([
      {
        id: "timed-result-1",
        challengeSetId: "collections",
        solvedCount: 2,
        elapsedSeconds: 754,
        completedAt: "2026-08-10T12:00:00.000Z",
      },
    ]);

    render(await TimedCodingChallengePage({}));

    expect(screen.getByText("Recent timed results")).toBeVisible();
    expect(screen.getByText("12m 34s")).toBeVisible();
    expect(screen.getByText("2 of 3")).toBeVisible();
    expect(screen.getByText("Aug 10, 2026")).toBeVisible();
    expect(getRecentResults).toHaveBeenCalledWith("returning-timed-learner");
  });
});

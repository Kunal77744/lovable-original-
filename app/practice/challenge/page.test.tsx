import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCodingCatalogProgress } from "@/db/coding-practice";
import { auth } from "@/lib/auth";
import TimedCodingChallengePage, { metadata } from "./page";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
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

const getSession = vi.mocked(auth.api.getSession);
const getProgress = vi.mocked(getCodingCatalogProgress);

describe("TimedCodingChallengePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  afterEach(cleanup);

  it("shows three existing problems and the exact next unfinished action", async () => {
    getSession.mockResolvedValue({
      user: { id: "challenge-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
      completedCount: 2,
      totalCount: 12,
      completedSlugs: ["sum-two-numbers", "even-or-odd"],
    });

    render(await TimedCodingChallengePage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Three problems. Thirty focused minutes.",
      }),
    ).toBeVisible();
    expect(screen.getByText("Accepted 1 of 3")).toBeVisible();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(
      screen.getByRole("link", { name: "Open Largest value" }),
    ).toHaveAttribute("href", "/practice/largest-value");
    expect(screen.getByText("Next problem")).toBeVisible();
    expect(getProgress).toHaveBeenCalledWith("challenge-learner");
  });

  it("keeps the account-only challenge out of search", () => {
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
    });
  });
});

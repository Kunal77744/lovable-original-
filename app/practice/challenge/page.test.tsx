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

  it("keeps the account-only challenge out of search", () => {
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
    });
  });
});

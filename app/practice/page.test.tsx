import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCodingCatalogProgress,
  getCodingMistakeReviewQueueForStudent,
  getCodingProblemBookmarksForStudent,
} from "@/db/coding-practice";
import { auth } from "@/lib/auth";
import PracticePage from "./page";

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
  getCodingMistakeReviewQueueForStudent: vi.fn(),
  getCodingProblemBookmarksForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getProgress = vi.mocked(getCodingCatalogProgress);
const getReviewQueue = vi.mocked(getCodingMistakeReviewQueueForStudent);
const getBookmarks = vi.mocked(getCodingProblemBookmarksForStudent);

describe("PracticePage progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBookmarks.mockResolvedValue([]);
    getReviewQueue.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a fresh signed-in learner Accepted 0 of 6", async () => {
    getSession.mockResolvedValue({
      user: { id: "fresh-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 6,
      completedSlugs: [],
    });

    render(await PracticePage());

    expect(screen.getByText("Accepted 0 of 6")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue at step 1 of 6" }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
    expect(screen.getByLabelText("Accepted 0 of 6")).toHaveTextContent(
      "Accepted 0 of 6",
    );
    expect(
      screen.getByText("Saved privately to your account"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Review saved submissions" }),
    ).toHaveAttribute("href", "/submissions");
    expect(
      screen.getByText(
        "Each problem runs in browser-based JavaScript. Signed-in attempts are saved to your account.",
      ),
    ).toBeInTheDocument();
    expect(getProgress).toHaveBeenCalledWith("fresh-learner");
    expect(getBookmarks).toHaveBeenCalledWith("fresh-learner");
    expect(getReviewQueue).toHaveBeenCalledWith("fresh-learner");
    expect(screen.getByText("Nothing saved yet. Use Save for later on any problem.")).toBeInTheDocument();
    expect(screen.getByText("No concepts waiting. A saved Wrong Answer adds one here; an Accepted retry clears it.")).toBeInTheDocument();
  });

  it("restores a returning learner's saved Accepted total", async () => {
    getSession.mockResolvedValue({
      user: { id: "returning-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
      completedCount: 2,
      totalCount: 6,
      completedSlugs: ["sum-two-numbers", "reverse-a-word"],
    });
    getBookmarks.mockResolvedValue([
      {
        slug: "reverse-a-word",
        number: 5,
        title: "Reverse a word",
        skill: "String traversal",
      },
    ]);
    getReviewQueue.mockResolvedValue([
      {
        slug: "largest-value",
        number: 4,
        title: "Largest value",
        skill: "Arrays",
        concept: "Compare only the data values",
        recoveryHint:
          "Separate the leading count from the values you compare. Test an all-negative list so a starting value of zero cannot hide the mistake.",
        passedTests: 3,
        totalTests: 4,
        attemptedAt: "2026-08-04T09:00:00.000Z",
      },
    ]);

    render(await PracticePage());

    expect(screen.getByText("Accepted 2 of 6")).toBeInTheDocument();
    expect(screen.getByLabelText("Accepted 2 of 6")).toHaveTextContent(
      "Accepted 2 of 6",
    );
    expect(
      document.querySelectorAll(".problem-row.is-complete"),
    ).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "Continue at step 2 of 6" }),
    ).toHaveAttribute("href", "/practice/even-or-odd");
    expect(
      screen.getByRole("link", { name: "Open the playground" }),
    ).toHaveAttribute("href", "/playground");
    expect(getProgress).toHaveBeenCalledWith("returning-learner");
    expect(
      screen.getByRole("link", {
        name: /05\s*Reverse a word\s*String traversal/,
      }),
    ).toHaveAttribute("href", "/practice/reverse-a-word");
    expect(screen.getByText("Compare only the data values")).toBeInTheDocument();
    expect(screen.getByText("Latest attempt: 3/4 checks")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Review Largest value" }),
    ).toHaveAttribute("href", "/practice/largest-value");
    expect(document.querySelector(".mistake-review")).not.toHaveTextContent(
      /function solve|learner code/i,
    );
  });

  it("describes the catalog without implying personal progress when signed out", async () => {
    getSession.mockResolvedValue(null);
    getProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 6,
      completedSlugs: [],
    });

    render(await PracticePage());

    expect(screen.getByText("6 problems")).toBeInTheDocument();
    expect(screen.getByLabelText("6 problems")).toHaveTextContent("6 problems");
    expect(
      screen.queryByText("Saved privately to your account"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Open the playground" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Review saved submissions" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Accepted 0 of 6")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start step 1 of 6" }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
    expect(getProgress).toHaveBeenCalledWith(null);
    expect(getBookmarks).not.toHaveBeenCalled();
    expect(getReviewQueue).not.toHaveBeenCalled();
    expect(screen.queryByText("Saved for later")).not.toBeInTheDocument();
    expect(screen.queryByText("Mistakes to revisit")).not.toBeInTheDocument();
  });

  it("shows one completed six-step outcome without inventing another step", async () => {
    getSession.mockResolvedValue({
      user: { id: "complete-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
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

    render(await PracticePage());

    expect(
      screen.getByText(
        "Six-step path complete. Every Accepted result is saved.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Review the six-step path" }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
    expect(screen.getAllByText("Accepted")).toHaveLength(6);
  });
});

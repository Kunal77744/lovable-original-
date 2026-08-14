import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PracticeJournalPage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  getJournals: vi.fn(),
  getProgress: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/db/coding-practice", () => ({
  getCodingProblemJournalsForStudent: mocks.getJournals,
  getCodingCatalogProgress: mocks.getProgress,
}));

describe("PracticeJournalPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getJournals.mockResolvedValue([]);
    mocks.getProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 12,
      completedSlugs: [],
    });
  });

  it("keeps the private notebook out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("returns signed-out visitors to the exact notebook before private reads", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(PracticeJournalPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin&next=%2Fpractice%2Fjournal",
    );
    expect(mocks.getJournals).not.toHaveBeenCalled();
    expect(mocks.getProgress).not.toHaveBeenCalled();
  });

  it("loads only the signed-in account and renders its saved journal", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "learner-1", email: "private@example.com" },
    });
    mocks.getJournals.mockResolvedValue([
      {
        problemSlug: "sum-two-numbers",
        content: JSON.stringify({
          v: 1,
          i: "Two integers",
          e: "Negative values",
          s: "Split, convert, add",
          r: "Convert before arithmetic",
        }),
        updatedAt: "2026-08-11T09:00:00.000Z",
      },
    ]);
    mocks.getProgress.mockResolvedValue({
      completedCount: 1,
      totalCount: 12,
      completedSlugs: ["sum-two-numbers"],
    });

    render(await PracticeJournalPage());

    expect(mocks.getJournals).toHaveBeenCalledWith("learner-1");
    expect(mocks.getProgress).toHaveBeenCalledWith("learner-1");
    expect(screen.getByText("Convert before arithmetic")).toBeInTheDocument();
    expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
  });

  it("renders a truthful empty account without creating a journal", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "fresh-learner" },
    });

    render(await PracticeJournalPage());

    expect(
      screen.getByRole("heading", {
        name: "Your first plan starts beside the editor.",
      }),
    ).toBeInTheDocument();
    expect(mocks.getJournals).toHaveBeenCalledTimes(1);
    expect(mocks.getProgress).toHaveBeenCalledTimes(1);
  });
});

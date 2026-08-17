import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PracticeBookmarksPage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
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
  getCodingProblemBookmarksForStudent: mocks.getBookmarks,
  getCodingCatalogProgress: mocks.getProgress,
}));

describe("PracticeBookmarksPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getBookmarks.mockResolvedValue([]);
    mocks.getProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 12,
      completedSlugs: [],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps the private collection out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("keeps the exact route through sign-in before private reads", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(PracticeBookmarksPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin&next=%2Fpractice%2Fbookmarks",
    );
    expect(mocks.getBookmarks).not.toHaveBeenCalled();
    expect(mocks.getProgress).not.toHaveBeenCalled();
  });

  it("shows only the signed-in learner's saved problems and prioritizes unfinished work", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "learner-a", email: "private@example.com" },
    });
    mocks.getBookmarks.mockResolvedValue([
      {
        slug: "sum-two-numbers",
        number: 1,
        title: "Sum two numbers",
        skill: "Input parsing",
      },
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
        skill: "String traversal",
      },
    ]);
    mocks.getProgress.mockResolvedValue({
      completedCount: 2,
      totalCount: 12,
      completedSlugs: ["sum-two-numbers", "reverse-a-word"],
    });

    render(await PracticeBookmarksPage());

    expect(mocks.getBookmarks).toHaveBeenCalledWith("learner-a");
    expect(mocks.getProgress).toHaveBeenCalledWith("learner-a");
    expect(screen.getByLabelText("3 saved problems")).toHaveTextContent(
      "3problemsPrivate to your account",
    );
    expect(
      screen.getByRole("link", { name: "Open first unfinished save" }),
    ).toHaveAttribute("href", "/practice/largest-value");
    expect(screen.getByRole("link", { name: "Open Sum two numbers" })).toHaveAttribute(
      "href",
      "/practice/sum-two-numbers",
    );
    expect(screen.getByRole("link", { name: "Open Largest value" })).toHaveAttribute(
      "href",
      "/practice/largest-value",
    );
    expect(screen.getByRole("link", { name: "Open Reverse a word" })).toHaveAttribute(
      "href",
      "/practice/reverse-a-word",
    );
    expect(screen.getByText("1 unfinished · 2 Accepted")).toBeInTheDocument();
    expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/function solve|learner code/i);
  });

  it("shows a truthful empty collection", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "fresh-learner" } });

    render(await PracticeBookmarksPage());

    expect(
      screen.getByRole("heading", {
        name: "Build your collection from the problem path.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Browse all 12 problems" }),
    ).toHaveAttribute("href", "/practice");
  });
});

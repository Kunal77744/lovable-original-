import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LearningHistoryPage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  getHistory: vi.fn(),
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

vi.mock("@/db/learning-history", () => ({
  getLearningHistoryForStudent: mocks.getHistory,
}));

describe("LearningHistoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getHistory.mockResolvedValue([]);
  });

  afterEach(() => cleanup());

  it("keeps the account-only timeline out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(JSON.stringify(metadata)).not.toMatch(/public profile|leaderboard/i);
  });

  it("redirects before reading private results", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(LearningHistoryPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin&next=%2Flearning-history",
    );
    expect(mocks.getHistory).not.toHaveBeenCalled();
  });

  it("loads only the signed-in learner's bounded timeline", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "learner-history-1" } });
    mocks.getHistory.mockResolvedValue([
      {
        id: "submission-1",
        kind: "judged-javascript",
        category: "Judged JavaScript · Problem 01",
        title: "Add two numbers",
        result: "Accepted · 4/4 checks",
        occurredAt: "2026-08-11T12:00:00.000Z",
        href: "/practice/sum-two-numbers",
        actionLabel: "Reopen problem",
        code: "PRIVATE SOURCE MUST NOT RENDER",
        email: "private@example.com",
      },
      {
        id: "css-1",
        kind: "css",
        category: "CSS practice · Challenge 01",
        title: "Select one card",
        result: "Needs revision · 2/3 checks",
        occurredAt: "2026-08-10T12:00:00.000Z",
        href: "/practice/css/class-selector",
        actionLabel: "Reopen challenge",
      },
    ]);

    render(await LearningHistoryPage());

    expect(
      screen.getByRole("heading", { name: "Every saved result, in order." }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 recent results")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Continue from the newest result/ }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
    expect(screen.getByText("Needs revision · 2/3 checks")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("PRIVATE SOURCE MUST NOT RENDER");
    expect(document.body).not.toHaveTextContent("private@example.com");
    expect(mocks.getHistory).toHaveBeenCalledWith("learner-history-1");
  });

  it("shows an honest empty state without creating a record", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "fresh-learner" } });

    render(await LearningHistoryPage());

    expect(
      screen.getByRole("heading", {
        name: "Your first result will appear here.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Start your learning path/ }),
    ).toHaveAttribute("href", "/dashboard");
  });
});

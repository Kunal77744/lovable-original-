import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProjectReviewHistoryPage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getHistory: vi.fn(),
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

vi.mock("@/db/project-review-history", () => ({
  getProjectReviewHistory: mocks.getHistory,
}));

describe("ProjectReviewHistoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: "learner-1" } });
    mocks.getHistory.mockResolvedValue([]);
  });

  afterEach(() => cleanup());

  it("keeps the private review record out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("redirects to the exact private route before reading account data", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(ProjectReviewHistoryPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin&next=%2Fprojects%2Fhistory",
    );
    expect(mocks.getHistory).not.toHaveBeenCalled();
  });

  it("reads only the signed-in learner's newest review history", async () => {
    render(await ProjectReviewHistoryPage());

    expect(mocks.getHistory).toHaveBeenCalledWith("learner-1");
    expect(
      screen.getByRole("heading", { name: "Compare every saved review." }),
    ).toBeInTheDocument();
  });
});

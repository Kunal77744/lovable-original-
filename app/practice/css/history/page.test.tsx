import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CssAttemptHistoryPage, { metadata } from "./page";

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

vi.mock("@/db/css-practice", () => ({
  getCssPracticeHistoryForStudent: mocks.getHistory,
}));

describe("CssAttemptHistoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getHistory.mockResolvedValue([]);
  });

  afterEach(cleanup);

  it("keeps private CSS results out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("returns signed-out learners to the exact private route", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(CssAttemptHistoryPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin&next=%2Fpractice%2Fcss%2Fhistory",
    );
    expect(mocks.getHistory).not.toHaveBeenCalled();
  });

  it("reads only the signed-in learner's CSS attempts", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "learner-1", email: "private@example.com" },
    });

    render(await CssAttemptHistoryPage());

    expect(mocks.getHistory).toHaveBeenCalledWith("learner-1");
    expect(
      screen.getByRole("heading", { name: "See recent saved results in one place." }),
    ).toBeInTheDocument();
    expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
  });
});

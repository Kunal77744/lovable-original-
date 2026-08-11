import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CourseQuizHistoryPage, { metadata } from "./page";

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

vi.mock("@/db/course", () => ({
  getFirstCourseQuizHistoryForStudent: mocks.getHistory,
}));

describe("CourseQuizHistoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getHistory.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps the account-scoped record out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(JSON.stringify(metadata)).toContain("account-scoped");
  });

  it("redirects to exact sign-in continuation before reading attempts", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(CourseQuizHistoryPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin&next=%2Fcourses%2Fweb-development-foundations%2Fquiz-history",
    );
    expect(mocks.getHistory).not.toHaveBeenCalled();
  });

  it("reads only the signed-in learner's attempts", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "learner-1", name: "Learner", email: "private@example.com" },
    });

    render(await CourseQuizHistoryPage());

    expect(mocks.getHistory).toHaveBeenCalledWith("learner-1");
    expect(
      screen.getByRole("heading", {
        name: "See the work behind your best score.",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
  });
});

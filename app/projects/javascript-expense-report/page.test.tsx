import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import JavaScriptExpenseReportPage, { metadata } from "./page";
import { getJavaScriptCapstoneForStudent } from "@/db/javascript-capstone";
import { auth } from "@/lib/auth";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));
vi.mock("@/db/javascript-capstone", () => ({
  getJavaScriptCapstoneForStudent: vi.fn(),
}));

describe("private JavaScript capstone page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "learner-1" },
    } as never);
    vi.mocked(getJavaScriptCapstoneForStudent).mockResolvedValue({
      code: "function solve(input) { return input; }",
      saved: false,
      updatedAt: null,
      hasUnreviewedChanges: false,
      submission: null,
    });
  });

  it("keeps the account-only project out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("loads one integrated project with one primary review action", async () => {
    render(await JavaScriptExpenseReportPage());

    expect(screen.getByText("Private JavaScript capstone")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Expense report builder" })).toBeVisible();
    expect(screen.getByText("6 outcomes")).toBeVisible();
    expect(screen.getByRole("button", { name: "Submit for review" })).toBeVisible();
    expect(getJavaScriptCapstoneForStudent).toHaveBeenCalledWith("learner-1");
  });
});

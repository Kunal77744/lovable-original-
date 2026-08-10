import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import JavaScriptExpenseReportPage, { metadata } from "./page";
import {
  getJavaScriptCapstoneForStudent,
  getJavaScriptCapstoneSummary,
} from "@/db/javascript-capstone";
import { getJavaScriptLabCatalogProgress } from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";

const navigation = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/navigation", () => ({ redirect: navigation.redirect }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));
vi.mock("@/db/javascript-capstone", () => ({
  getJavaScriptCapstoneForStudent: vi.fn(),
  getJavaScriptCapstoneSummary: vi.fn(),
}));
vi.mock("@/db/javascript-lab-progress", () => ({
  getJavaScriptLabCatalogProgress: vi.fn(),
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
    vi.mocked(getJavaScriptCapstoneSummary).mockResolvedValue({
      state: "not-started",
      passedChecks: 0,
    });
    vi.mocked(getJavaScriptLabCatalogProgress).mockResolvedValue({
      completedCount: 55,
      totalCount: 55,
      nextLabSlug: null,
      nextLabTitle: null,
      nextHref: "/practice",
      nextExerciseNumber: null,
      labs: [],
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

  it("returns a fresh learner to the exact unfinished guided step", async () => {
    vi.mocked(getJavaScriptLabCatalogProgress).mockResolvedValue({
      completedCount: 18,
      totalCount: 55,
      nextLabSlug: "functions",
      nextLabTitle: "Functions and scope",
      nextHref: "/practice/functions?exercise=3",
      nextExerciseNumber: 3,
      labs: [],
    });

    await expect(JavaScriptExpenseReportPage()).rejects.toThrow(
      "REDIRECT:/practice/functions?exercise=3",
    );
    expect(getJavaScriptCapstoneForStudent).not.toHaveBeenCalled();
  });

  it("preserves direct access for an existing capstone draft", async () => {
    vi.mocked(getJavaScriptCapstoneSummary).mockResolvedValue({
      state: "in-progress",
      passedChecks: 2,
    });
    vi.mocked(getJavaScriptLabCatalogProgress).mockResolvedValue({
      completedCount: 18,
      totalCount: 55,
      nextLabSlug: "functions",
      nextLabTitle: "Functions and scope",
      nextHref: "/practice/functions?exercise=3",
      nextExerciseNumber: 3,
      labs: [],
    });

    render(await JavaScriptExpenseReportPage());

    expect(getJavaScriptCapstoneForStudent).toHaveBeenCalledWith("learner-1");
    expect(navigation.redirect).not.toHaveBeenCalled();
  });
});

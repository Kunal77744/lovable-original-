import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getGuidedProjectFeedbackForStudent,
  getGuidedProjectForStudent,
} from "@/db/guided-project";
import { getCodingCatalogProgress } from "@/db/coding-practice";
import { auth } from "@/lib/auth";
import SemanticHtmlProjectPage, { metadata } from "./page";

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

vi.mock("@/db/guided-project", () => ({
  getGuidedProjectFeedbackForStudent: vi.fn(),
  getGuidedProjectForStudent: vi.fn(),
}));

vi.mock("@/db/coding-practice", () => ({
  getCodingCatalogProgress: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getProject = vi.mocked(getGuidedProjectForStudent);
const getProjectFeedback = vi.mocked(getGuidedProjectFeedbackForStudent);
const getPracticeProgress = vi.mocked(getCodingCatalogProgress);

describe("SemanticHtmlProjectPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({
      user: { id: "learner-1" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProject.mockResolvedValue({
      html: "<main><article></article></main>",
      saved: false,
      updatedAt: null,
      hasUnreviewedChanges: false,
      submission: null,
    });
    getProjectFeedback.mockResolvedValue({ feedback: null });
    getPracticeProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 6,
      completedSlugs: [],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps the account-only project out of search", () => {
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
    });
  });

  it("loads the private learner project and its bounded brief", async () => {
    render(await SemanticHtmlProjectPage());

    expect(getProject).toHaveBeenCalledWith(
      "learner-1",
      "semantic-html-article",
    );
    expect(getProjectFeedback).toHaveBeenCalledWith(
      "learner-1",
      "semantic-html-article",
    );
    expect(screen.getByText("Private project")).toBeVisible();
    expect(
      screen.getByText(
        /Saved drafts and review results belong only to your signed-in account\./,
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Semantic HTML field guide" }),
    ).toBeInTheDocument();
    expect(screen.getByText("6 checks")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Build, review, revise." }),
    ).toBeInTheDocument();
  });

  it("teaches a fresh learner how judging works after project completion", async () => {
    getProject.mockResolvedValue({
      html: "<header></header><main><article></article></main><footer></footer>",
      saved: true,
      updatedAt: "2026-08-06T08:00:00.000Z",
      hasUnreviewedChanges: false,
      submission: {
        status: "completed",
        checks: [],
        passedChecks: 6,
        totalChecks: 6,
        submittedAt: "2026-08-06T08:00:00.000Z",
      },
    });

    render(await SemanticHtmlProjectPage());

    expect(
      screen.getByRole("link", { name: "Learn how JavaScript judging works" }),
    ).toHaveAttribute("href", "/practice/judge-basics");
  });

  it("names the exact unfinished JavaScript step after project completion", async () => {
    getPracticeProgress.mockResolvedValue({
      completedCount: 2,
      totalCount: 6,
      completedSlugs: ["sum-two-numbers", "even-or-odd"],
    });
    getProject.mockResolvedValue({
      html: "<header></header><main><article></article></main><footer></footer>",
      saved: true,
      updatedAt: "2026-07-29T04:50:00.000Z",
      hasUnreviewedChanges: false,
      submission: {
        status: "completed",
        checks: [],
        passedChecks: 6,
        totalChecks: 6,
        submittedAt: "2026-07-29T04:50:00.000Z",
      },
    });

    render(await SemanticHtmlProjectPage());

    expect(getPracticeProgress).toHaveBeenCalledWith("learner-1");
    expect(
      screen.getByRole("link", {
        name: /Continue to JavaScript step 03: Multiplication table/,
      }),
    ).toHaveAttribute("href", "/practice/multiplication-table");
  });
});

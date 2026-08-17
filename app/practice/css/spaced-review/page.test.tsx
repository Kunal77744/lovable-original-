import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { getCssPracticeCatalogProgress } from "@/db/css-practice";
import { getCssSpacedReviewResultForStudent } from "@/db/css-spaced-review";
import { auth } from "@/lib/auth";
import CssSpacedReviewPage, { metadata } from "./page";

vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue(new Headers()) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/db/css-practice", () => ({ getCssPracticeCatalogProgress: vi.fn() }));
vi.mock("@/db/css-spaced-review", () => ({
  getCssSpacedReviewResultForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getProgress = vi.mocked(getCssPracticeCatalogProgress);
const getReview = vi.mocked(getCssSpacedReviewResultForStudent);

describe("CssSpacedReviewPage", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    getReview.mockResolvedValue(null);
  });

  it("redirects to the exact route before reading private CSS state", async () => {
    getSession.mockResolvedValue(null);
    expect(await CssSpacedReviewPage()).toBeNull();
    expect(redirect).toHaveBeenCalledWith(
      "/account?mode=signin&next=%2Fpractice%2Fcss%2Fspaced-review",
    );
    expect(getProgress).not.toHaveBeenCalled();
    expect(getReview).not.toHaveBeenCalled();
  });

  it("shows the four-concept private review after CSS completion", async () => {
    getSession.mockResolvedValue({ user: { id: "learner" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    getProgress.mockResolvedValue({
      completedCount: 6,
      totalCount: 6,
      completedSlugs: [],
      nextChallengeSlug: null,
    });
    render(await CssSpacedReviewPage());

    expect(
      screen.getByRole("heading", {
        name: "Recall the CSS decisions before the browser surprises you.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("4 CSS concepts")).toBeInTheDocument();
    expect(screen.getByText("Concept 1 of 4")).toBeInTheDocument();
  });

  it("restores the saved result before the next due date", async () => {
    getSession.mockResolvedValue({ user: { id: "learner" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    getProgress.mockResolvedValue({
      completedCount: 6,
      totalCount: 6,
      completedSlugs: [],
      nextChallengeSlug: null,
    });
    getReview.mockResolvedValue({
      correctCount: 3,
      totalCount: 4,
      completedAt: "2026-08-15T12:00:00.000Z",
      nextDueAt: "2126-08-22T12:00:00.000Z",
    });
    render(await CssSpacedReviewPage());

    expect(
      screen.getByRole("heading", { name: "Your next CSS review is set for Aug 22." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Last recall 3/4. Only the result and due date are saved."),
    ).toBeInTheDocument();
  });

  it("is private and excluded from indexing", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

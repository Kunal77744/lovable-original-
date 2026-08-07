import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getJavaScriptLabCatalogProgress } from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import JavaScriptMixedReviewPage, { metadata } from "./page";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/db/javascript-lab-progress", () => ({
  getJavaScriptLabCatalogProgress: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getLabProgress = vi.mocked(getJavaScriptLabCatalogProgress);
const redirectMock = vi.mocked(redirect);

describe("JavaScriptMixedReviewPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects before reading private progress when signed out", async () => {
    getSession.mockResolvedValue(null);

    expect(await JavaScriptMixedReviewPage()).toBeNull();
    expect(redirectMock).toHaveBeenCalledWith(
      "/account?mode=signin&next=/practice/mixed-review",
    );
    expect(getLabProgress).not.toHaveBeenCalled();
  });

  it("uses completed lab progress and keeps the exact unfinished route available", async () => {
    getSession.mockResolvedValue({ user: { id: "learner" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    getLabProgress.mockResolvedValue({
      completedCount: 2,
      totalCount: 55,
      nextLabSlug: "debugging",
      nextLabTitle: "Debugging",
      nextHref: "/practice/debugging?exercise=2",
      nextExerciseNumber: 2,
      labs: [
        { slug: "foundations", title: "Foundations", href: "/practice/foundations", completedCount: 4, totalCount: 4, nextExerciseNumber: null, state: "complete" },
        { slug: "tracing", title: "Tracing", href: "/practice/tracing", completedCount: 4, totalCount: 4, nextExerciseNumber: null, state: "complete" },
        { slug: "debugging", title: "Debugging", href: "/practice/debugging", completedCount: 1, totalCount: 4, nextExerciseNumber: 2, state: "in-progress" },
      ],
    });

    render(await JavaScriptMixedReviewPage());

    expect(screen.getByRole("heading", { name: "Complete three labs first." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue guided JavaScript" })).toHaveAttribute(
      "href",
      "/practice/debugging?exercise=2",
    );
    expect(getLabProgress).toHaveBeenCalledWith("learner");
  });

  it("is private and excluded from indexing", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

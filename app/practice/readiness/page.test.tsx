import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getJavaScriptLabCatalogProgress } from "@/db/javascript-lab-progress";
import { getJavaScriptReadinessResultForStudent } from "@/db/javascript-readiness";
import { auth } from "@/lib/auth";
import JavaScriptReadinessPage, { metadata } from "./page";

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));
vi.mock("@/db/javascript-readiness", () => ({
  getJavaScriptReadinessResultForStudent: vi.fn(),
}));
vi.mock("@/db/javascript-lab-progress", () => ({
  getJavaScriptLabCatalogProgress: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getResult = vi.mocked(getJavaScriptReadinessResultForStudent);
const getLabProgress = vi.mocked(getJavaScriptLabCatalogProgress);

describe("JavaScript readiness page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLabProgress.mockResolvedValue({
      completedCount: 1,
      totalCount: 55,
      nextLabSlug: "foundations",
      nextLabTitle: "JavaScript foundations",
      nextHref: "/practice/foundations",
      nextExerciseNumber: 2,
      labs: [
        {
          slug: "foundations",
          title: "JavaScript foundations",
          href: "/practice/foundations",
          completedCount: 1,
          totalCount: 4,
          nextExerciseNumber: 2,
          state: "in-progress",
        },
        {
          slug: "tracing",
          title: "Code tracing",
          href: "/practice/tracing",
          completedCount: 0,
          totalCount: 4,
          nextExerciseNumber: 1,
          state: "not-started",
        },
      ],
    });
  });

  afterEach(cleanup);

  it("redirects signed-out visitors before reading private results", async () => {
    getSession.mockResolvedValue(null);
    await JavaScriptReadinessPage();

    expect(redirect).toHaveBeenCalledWith(
      "/account?mode=signin&next=/practice/readiness",
    );
    expect(getResult).not.toHaveBeenCalled();
    expect(getLabProgress).not.toHaveBeenCalled();
  });

  it("restores the account result with one exact lab action", async () => {
    getSession.mockResolvedValue({ user: { id: "learner-a" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    getResult.mockResolvedValue({
      correctCount: 5,
      totalCount: 6,
      recommendedLabSlug: "tracing",
      completedAt: "2026-08-07T12:00:00.000Z",
    });

    render(await JavaScriptReadinessPage());

    expect(
      screen.getByRole("heading", { name: "Find the right lab before you practice." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open recommended lab" }),
    ).toHaveAttribute("href", "/practice/tracing");
    expect(getResult).toHaveBeenCalledWith("learner-a");
    expect(getLabProgress).toHaveBeenCalledWith("learner-a");
    expect(JSON.stringify(document.body.textContent)).not.toMatch(/learner-a|email/i);
  });

  it("stays private and out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

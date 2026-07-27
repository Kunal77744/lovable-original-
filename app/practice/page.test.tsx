import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCodingCatalogProgress } from "@/db/coding-practice";
import { auth } from "@/lib/auth";
import PracticePage from "./page";

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

vi.mock("@/db/coding-practice", () => ({
  getCodingCatalogProgress: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getProgress = vi.mocked(getCodingCatalogProgress);

describe("PracticePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps problem solving primary and gives signed-in learners one playground continuation", async () => {
    getSession.mockResolvedValue({
      user: { id: "learner-1" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
      completedCount: 2,
      totalCount: 6,
      completedSlugs: ["sum-two-numbers", "reverse-a-word"],
    });

    render(await PracticePage());

    expect(
      screen.getByRole("link", { name: "Solve problem 01" }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
    expect(
      screen.getByRole("link", { name: "Open the playground" }),
    ).toHaveAttribute("href", "/playground");
    expect(screen.getByText("Accepted 2 of 6")).toBeInTheDocument();
    expect(
      document.querySelectorAll(".problem-row.is-complete"),
    ).toHaveLength(2);
    expect(getProgress).toHaveBeenCalledWith("learner-1");
  });

  it("keeps the signed-out catalog focused on the six public problems", async () => {
    getSession.mockResolvedValue(null);
    getProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 6,
      completedSlugs: [],
    });

    render(await PracticePage());

    expect(screen.getByText("6 problems")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Open the playground" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Accepted 0 of 6")).not.toBeInTheDocument();
    expect(getProgress).toHaveBeenCalledWith(null);
  });
});

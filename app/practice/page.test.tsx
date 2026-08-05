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

describe("PracticePage progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a fresh signed-in learner Accepted 0 of 6", async () => {
    getSession.mockResolvedValue({
      user: { id: "fresh-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 6,
      completedSlugs: [],
    });

    render(await PracticePage());

    expect(screen.getByText("Accepted 0 of 6")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue at step 1 of 6" }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
    expect(screen.getByLabelText("Accepted 0 of 6")).toHaveTextContent(
      "Accepted 0 of 6",
    );
    expect(
      screen.getByRole("link", { name: "View private skill record" }),
    ).toHaveAttribute("href", "/practice/progress");
    expect(getProgress).toHaveBeenCalledWith("fresh-learner");
  });

  it("restores a returning learner's saved Accepted total", async () => {
    getSession.mockResolvedValue({
      user: { id: "returning-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
      completedCount: 2,
      totalCount: 6,
      completedSlugs: ["sum-two-numbers", "reverse-a-word"],
    });

    render(await PracticePage());

    expect(screen.getByText("Accepted 2 of 6")).toBeInTheDocument();
    expect(screen.getByLabelText("Accepted 2 of 6")).toHaveTextContent(
      "Accepted 2 of 6",
    );
    expect(
      document.querySelectorAll(".problem-row.is-complete"),
    ).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "Continue at step 2 of 6" }),
    ).toHaveAttribute("href", "/practice/even-or-odd");
    expect(
      screen.getByRole("link", { name: "Open the playground" }),
    ).toHaveAttribute("href", "/playground");
    expect(
      screen.getByRole("link", { name: "View 28-day activity" }),
    ).toHaveAttribute("href", "/practice/activity");
    expect(
      screen.getByRole("link", { name: "Try a 30-minute challenge" }),
    ).toHaveAttribute("href", "/practice/challenge");
    expect(
      screen.getByRole("link", { name: "Repair the first defect" }),
    ).toHaveAttribute("href", "/practice/debugging");
    expect(getProgress).toHaveBeenCalledWith("returning-learner");
  });

  it("describes the catalog without implying personal progress when signed out", async () => {
    getSession.mockResolvedValue(null);
    getProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 6,
      completedSlugs: [],
    });

    render(await PracticePage());

    expect(screen.getByText("6 problems")).toBeInTheDocument();
    expect(screen.getByLabelText("6 problems")).toHaveTextContent("6 problems");
    expect(
      screen.queryByRole("link", { name: "Open the playground" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "View private skill record" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "View 28-day activity" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Try a 30-minute challenge" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Repair the first defect" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Accepted 0 of 6")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start step 1 of 6" }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
    expect(getProgress).toHaveBeenCalledWith(null);
  });

  it("shows one completed six-step outcome without inventing another step", async () => {
    getSession.mockResolvedValue({
      user: { id: "complete-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
      completedCount: 6,
      totalCount: 6,
      completedSlugs: [
        "sum-two-numbers",
        "even-or-odd",
        "multiplication-table",
        "largest-value",
        "reverse-a-word",
        "fizz-buzz",
      ],
    });

    render(await PracticePage());

    expect(
      screen.getByText(
        "Six-step path complete. Every Accepted result is saved.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Review the six-step path" }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
    expect(screen.getAllByText("Accepted")).toHaveLength(6);
  });
});

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { getCompletedJavaScriptLabExerciseIds } from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";
import JavaScriptAlgorithmPatternsPage, { metadata } from "./page";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));
vi.mock("@/db/javascript-lab-progress", () => ({
  getCompletedJavaScriptLabExerciseIds: vi.fn().mockResolvedValue([]),
  getJavaScriptLabExerciseDrafts: vi.fn().mockResolvedValue({}),
}));

const getSession = vi.mocked(auth.api.getSession);
const redirectMock = vi.mocked(redirect);
const getCompletedExerciseIds = vi.mocked(getCompletedJavaScriptLabExerciseIds);

describe("JavaScriptAlgorithmPatternsPage", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("redirects signed-out visitors before reading private progress", async () => {
    getSession.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(JavaScriptAlgorithmPatternsPage()).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(redirectMock).toHaveBeenCalledWith(
      "/account?mode=signin&next=/practice/algorithm-patterns",
    );
    expect(getCompletedExerciseIds).not.toHaveBeenCalled();
  });

  it("renders the implementation lab at the first unfinished pattern", async () => {
    getSession.mockResolvedValue({
      user: { id: "algorithm-pattern-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getCompletedExerciseIds.mockResolvedValue(["count-with-a-frequency-map"]);

    render(await JavaScriptAlgorithmPatternsPage());

    expect(
      screen.getByRole("heading", {
        name: "Recognize the pattern before writing the loop.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Pattern 2 of 4")).toBeInTheDocument();
    expect(
      screen.getByText(/separate efficiency lab asks you to compare/),
    ).toBeInTheDocument();
    expect(getCompletedExerciseIds).toHaveBeenCalledWith(
      "algorithm-pattern-learner",
      "algorithm-patterns",
    );
  });

  it("keeps the private route out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

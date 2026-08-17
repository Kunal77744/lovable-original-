import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { getCompletedJavaScriptLabExerciseIds } from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";
import JavaScriptTreesGraphsPage, { metadata } from "./page";

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

describe("JavaScriptTreesGraphsPage", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("redirects signed-out visitors before reading private progress", async () => {
    getSession.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(JavaScriptTreesGraphsPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith(
      "/account?mode=signin&next=/practice/trees-graphs",
    );
    expect(getCompletedExerciseIds).not.toHaveBeenCalled();
  });

  it("renders the private four-exercise lab at the first unfinished step", async () => {
    getSession.mockResolvedValue({
      user: { id: "trees-graphs-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getCompletedExerciseIds.mockResolvedValue(["walk-a-tree-depth-first"]);

    render(await JavaScriptTreesGraphsPage());

    expect(
      screen.getByRole("heading", { name: "Choose which node comes next." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Traversal idea 2 of 4")).toBeInTheDocument();
    expect(getCompletedExerciseIds).toHaveBeenCalledWith(
      "trees-graphs-learner",
      "trees-graphs",
    );
  });

  it("keeps the private route out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

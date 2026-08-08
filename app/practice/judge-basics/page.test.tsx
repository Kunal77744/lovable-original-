import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";
import { getCompletedJavaScriptLabExerciseIds } from "@/db/javascript-lab-progress";
import JavaScriptJudgeBasicsPage, { metadata } from "./page";

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/db/javascript-lab-progress", () => ({
  getCompletedJavaScriptLabExerciseIds: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getCompletedExerciseIds = vi.mocked(
  getCompletedJavaScriptLabExerciseIds,
);

describe("JavaScriptJudgeBasicsPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("keeps the private lesson out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renders the judge lesson for a signed-in learner", async () => {
    getSession.mockResolvedValue({ user: { id: "learner-1" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    getCompletedExerciseIds.mockResolvedValue([]);

    render(await JavaScriptJudgeBasicsPage());

    expect(screen.getByRole("heading", { name: "Follow one value through the judge." })).toBeInTheDocument();
    expect(screen.getByText("JavaScript foundations · step 1 of 4")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "JavaScript foundations unit" }),
    ).toBeInTheDocument();
    expect(getCompletedExerciseIds).toHaveBeenCalledWith(
      "learner-1",
      "foundations",
    );
  });

  it("redirects signed-out visitors before rendering private content", async () => {
    getSession.mockResolvedValue(null);

    expect(await JavaScriptJudgeBasicsPage()).toBeNull();
    expect(redirectMock).toHaveBeenCalledWith(
      "/account?mode=signin&next=/practice/judge-basics",
    );
    expect(getCompletedExerciseIds).not.toHaveBeenCalled();
  });
});

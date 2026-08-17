import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import JavaScriptDataStructuresPage, { metadata } from "./page";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));
vi.mock("@/db/javascript-lab-progress", () => ({
  getCompletedJavaScriptLabExerciseIds: vi.fn().mockResolvedValue([]),
  getJavaScriptLabExerciseDrafts: vi.fn().mockResolvedValue({}),
}));

const getSession = vi.mocked(auth.api.getSession);
const redirectMock = vi.mocked(redirect);

describe("JavaScriptDataStructuresPage", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("redirects signed-out visitors before rendering private practice", async () => {
    getSession.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(JavaScriptDataStructuresPage()).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(redirectMock).toHaveBeenCalledWith(
      "/account?mode=signin&next=/practice/data-structures",
    );
  });

  it("renders the four-structure lab for a signed-in learner", async () => {
    getSession.mockResolvedValue({
      user: { id: "data-structure-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);

    render(await JavaScriptDataStructuresPage());

    expect(
      screen.getByRole("heading", {
        name: "Pick the structure that fits the problem.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Structure 1 of 4")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Drafts and completed exercises save privately\./,
      ),
    ).toBeInTheDocument();
  });

  it("keeps the private route out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

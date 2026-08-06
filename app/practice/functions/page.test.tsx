import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import JavaScriptFunctionsPage, { metadata } from "./page";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));
vi.mock("@/db/javascript-lab-progress", () => ({ getCompletedJavaScriptLabExerciseIds: vi.fn().mockResolvedValue([]) }));

const getSession = vi.mocked(auth.api.getSession);
const redirectMock = vi.mocked(redirect);

describe("JavaScriptFunctionsPage", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("redirects signed-out visitors before rendering private practice", async () => {
    getSession.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(JavaScriptFunctionsPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith(
      "/account?mode=signin&next=/practice/functions",
    );
  });

  it("renders the four-concept lab for a signed-in learner", async () => {
    getSession.mockResolvedValue({
      user: { id: "function-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);

    render(await JavaScriptFunctionsPage());

    expect(
      screen.getByRole("heading", {
        name: "Make functions small, useful, and reusable.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Function idea 1 of 4")).toBeInTheDocument();
    expect(screen.getByText(/Code stays local. Completed exercises save privately\./)).toBeInTheDocument();
  });

  it("keeps the private route out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

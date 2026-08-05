import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import JavaScriptDomPage, { metadata } from "./page";

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
vi.mock("@/db/javascript-lab-progress", () => ({ getCompletedJavaScriptLabExerciseIds: vi.fn().mockResolvedValue([]) }));

const getSession = vi.mocked(auth.api.getSession);
const redirectMock = vi.mocked(redirect);

describe("JavaScriptDomPage", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("redirects signed-out visitors before rendering private practice", async () => {
    getSession.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(JavaScriptDomPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith(
      "/account?mode=signin&next=/practice/dom",
    );
  });

  it("renders four DOM moves for a signed-in learner", async () => {
    getSession.mockResolvedValue({
      user: { id: "dom-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);

    render(await JavaScriptDomPage());

    expect(
      screen.getByRole("heading", { name: "Make JavaScript change the page." }),
    ).toBeInTheDocument();
    expect(screen.getByText("DOM move 1 of 4")).toBeInTheDocument();
    expect(
      screen.getByText(/Code stays local. Completed exercises save privately\./),
    ).toBeInTheDocument();
  });

  it("keeps the private route out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

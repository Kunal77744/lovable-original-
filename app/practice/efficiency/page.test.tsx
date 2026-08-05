import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";
import AlgorithmEfficiencyPage, { metadata } from "./page";

const redirectMock = vi.fn((url: string) => {
  throw new Error(`redirect:${url}`);
});

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

const getSession = vi.mocked(auth.api.getSession);

describe("AlgorithmEfficiencyPage", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it("redirects signed-out visitors before the private lab renders", async () => {
    getSession.mockResolvedValue(null);

    await expect(AlgorithmEfficiencyPage()).rejects.toThrow(
      "redirect:/account?mode=signin&next=/practice/efficiency",
    );
    expect(redirectMock).toHaveBeenCalledWith(
      "/account?mode=signin&next=/practice/efficiency",
    );
  });

  it("renders the four-decision lab for a signed-in learner", async () => {
    getSession.mockResolvedValue({
      user: { id: "efficiency-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);

    render(await AlgorithmEfficiencyPage());

    expect(
      screen.getByRole("heading", {
        name: "Choose the approach that still works at 10,000 inputs.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Find one learner by id")).toBeInTheDocument();
  });

  it("keeps the private route out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CodingWorkspacesPage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  getWorkspaces: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/db/coding-workspace-library", () => ({
  getCodingWorkspacesForStudent: mocks.getWorkspaces,
}));

describe("CodingWorkspacesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getWorkspaces.mockResolvedValue([]);
  });

  it("keeps the private collection out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("redirects to exact sign-in continuation before reading workspaces", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(CodingWorkspacesPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin&next=%2Fpractice%2Fworkspaces",
    );
    expect(mocks.getWorkspaces).not.toHaveBeenCalled();
  });

  it("loads only the signed-in learner workspaces", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "learner-1", email: "private@example.com" },
    });

    render(await CodingWorkspacesPage());

    expect(mocks.getWorkspaces).toHaveBeenCalledWith("learner-1");
    expect(
      screen.getByRole("heading", { name: "Return to the code you last touched." }),
    ).toBeInTheDocument();
    expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start problem 01" })).toHaveAttribute(
      "href",
      "/practice/sum-two-numbers",
    );
  });
});

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import JavaScriptCompletionRecordPage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getRecord: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
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

vi.mock("@/db/coding-skill-record", () => ({
  getJavaScriptCompletionRecordForStudent: mocks.getRecord,
}));

describe("JavaScriptCompletionRecordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRecord.mockResolvedValue({
      completedCount: 12,
      totalCount: 12,
      displayName: "Asha Singh",
      completedAt: "2026-08-10T11:00:00.000Z",
      nextProblem: null,
    });
  });

  it("keeps the private record out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("redirects to exact sign-in continuation before reading private results", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(JavaScriptCompletionRecordPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin&next=%2Fpractice%2Fcompletion-record",
    );
    expect(mocks.getRecord).not.toHaveBeenCalled();
  });

  it("loads only the signed-in learner's completion record", async () => {
    mocks.getSession.mockResolvedValue({
      user: {
        id: "learner-1",
        name: "Asha Account",
        email: "private@example.com",
      },
    });

    render(await JavaScriptCompletionRecordPage());

    expect(mocks.getRecord).toHaveBeenCalledWith("learner-1", "Asha Account");
    expect(screen.getByText("Asha Singh")).toBeInTheDocument();
    expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GET,
  POST,
} from "./route";
import {
  getJavaScriptCapstoneForStudent,
  saveJavaScriptCapstoneDraft,
  submitJavaScriptCapstone,
} from "@/db/javascript-capstone";
import { auth } from "@/lib/auth";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));
vi.mock("@/db/javascript-capstone", () => ({
  getJavaScriptCapstoneForStudent: vi.fn(),
  saveJavaScriptCapstoneDraft: vi.fn(),
  submitJavaScriptCapstone: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);

describe("JavaScript capstone API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies private reads before sign in", async () => {
    getSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(getJavaScriptCapstoneForStudent).not.toHaveBeenCalled();
  });

  it("restores only the signed-in learner's project", async () => {
    getSession.mockResolvedValue({ user: { id: "learner-1" } } as never);
    vi.mocked(getJavaScriptCapstoneForStudent).mockResolvedValue({
      code: "function solve() {}",
      saved: true,
      updatedAt: "2026-08-07T00:00:00.000Z",
      hasUnreviewedChanges: false,
      submission: null,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(getJavaScriptCapstoneForStudent).toHaveBeenCalledWith("learner-1");
  });

  it("saves a private draft without creating a review", async () => {
    getSession.mockResolvedValue({ user: { id: "learner-1" } } as never);
    vi.mocked(saveJavaScriptCapstoneDraft).mockResolvedValue({
      code: "function solve(input) { return input; }",
      saved: true,
      updatedAt: "2026-08-07T00:00:00.000Z",
      hasUnreviewedChanges: false,
      submission: null,
    });

    const response = await POST(
      new Request("http://localhost/api/projects/javascript-expense-report", {
        method: "POST",
        body: JSON.stringify({
          action: "save",
          code: "function solve(input) { return input; }",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(saveJavaScriptCapstoneDraft).toHaveBeenCalledWith(
      "learner-1",
      "function solve(input) { return input; }",
    );
    expect(submitJavaScriptCapstone).not.toHaveBeenCalled();
  });

  it("rejects a submission without all six browser outputs", async () => {
    getSession.mockResolvedValue({ user: { id: "learner-1" } } as never);
    vi.mocked(submitJavaScriptCapstone).mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/projects/javascript-expense-report", {
        method: "POST",
        body: JSON.stringify({
          action: "submit",
          code: "function solve(input) { return input; }",
          outputs: [],
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(submitJavaScriptCapstone).toHaveBeenCalledWith(
      "learner-1",
      "function solve(input) { return input; }",
      [],
    );
  });
});

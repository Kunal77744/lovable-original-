import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GET,
  POST,
} from "./route";
import {
  getJavaScriptCapstoneForStudent,
  getJavaScriptCapstoneSummary,
  saveJavaScriptCapstoneDraft,
  submitJavaScriptCapstone,
} from "@/db/javascript-capstone";
import { getJavaScriptLabCatalogProgress } from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));
vi.mock("@/db/javascript-capstone", () => ({
  getJavaScriptCapstoneForStudent: vi.fn(),
  getJavaScriptCapstoneSummary: vi.fn(),
  saveJavaScriptCapstoneDraft: vi.fn(),
  submitJavaScriptCapstone: vi.fn(),
}));
vi.mock("@/db/javascript-lab-progress", () => ({
  getJavaScriptLabCatalogProgress: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);

describe("JavaScript capstone API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getJavaScriptCapstoneSummary).mockResolvedValue({
      state: "in-progress",
      passedChecks: 0,
    });
    vi.mocked(getJavaScriptLabCatalogProgress).mockResolvedValue({
      completedCount: 0,
      totalCount: 55,
      nextLabSlug: "foundations",
      nextLabTitle: "JavaScript foundations",
      nextHref: "/practice/judge-basics",
      nextExerciseNumber: 1,
      labs: [],
    });
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

  it("blocks a fresh learner before reading project data", async () => {
    getSession.mockResolvedValue({ user: { id: "learner-1" } } as never);
    vi.mocked(getJavaScriptCapstoneSummary).mockResolvedValue({
      state: "not-started",
      passedChecks: 0,
    });

    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Complete the guided JavaScript path before opening this capstone.",
    });
    expect(getJavaScriptCapstoneForStudent).not.toHaveBeenCalled();
  });

  it("allows a fresh capstone after all guided steps are saved", async () => {
    getSession.mockResolvedValue({ user: { id: "learner-1" } } as never);
    vi.mocked(getJavaScriptCapstoneSummary).mockResolvedValue({
      state: "not-started",
      passedChecks: 0,
    });
    vi.mocked(getJavaScriptLabCatalogProgress).mockResolvedValue({
      completedCount: 55,
      totalCount: 55,
      nextLabSlug: null,
      nextLabTitle: null,
      nextHref: "/practice",
      nextExerciseNumber: null,
      labs: [],
    });
    vi.mocked(getJavaScriptCapstoneForStudent).mockResolvedValue({
      code: "function solve() {}",
      saved: false,
      updatedAt: null,
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

  it("blocks a fresh learner before saving project data", async () => {
    getSession.mockResolvedValue({ user: { id: "learner-1" } } as never);
    vi.mocked(getJavaScriptCapstoneSummary).mockResolvedValue({
      state: "not-started",
      passedChecks: 0,
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

    expect(response.status).toBe(403);
    expect(saveJavaScriptCapstoneDraft).not.toHaveBeenCalled();
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

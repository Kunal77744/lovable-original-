import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_JAVASCRIPT_LAB_DRAFT_LENGTH,
  saveJavaScriptLabExerciseDraft,
} from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";
import { POST } from "./route";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));
vi.mock("@/db/javascript-lab-progress", () => ({
  MAX_JAVASCRIPT_LAB_DRAFT_LENGTH: 20_000,
  saveJavaScriptLabExerciseDraft: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const saveDraft = vi.mocked(saveJavaScriptLabExerciseDraft);
const context = { params: Promise.resolve({ labSlug: "recursion" }) };

describe("POST /api/practice/labs/[labSlug]/draft", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects signed-out writes before touching learner data", async () => {
    getSession.mockResolvedValue(null);
    const response = await POST(
      new Request("http://localhost", { method: "POST", body: "{}" }),
      context,
    );

    expect(response.status).toBe(401);
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it("saves the exact draft against the signed-in account", async () => {
    getSession.mockResolvedValue({ user: { id: "learner-a" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    saveDraft.mockResolvedValue({ updatedAt: "2026-08-11T12:00:00.000Z" });
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          exerciseId: "base-case",
          source: "function solve(input) { return input; }",
        }),
      }),
      context,
    );

    expect(response.status).toBe(200);
    expect(saveDraft).toHaveBeenCalledWith(
      "learner-a",
      "recursion",
      "base-case",
      "function solve(input) { return input; }",
    );
  });

  it("rejects oversized source before the database write", async () => {
    getSession.mockResolvedValue({ user: { id: "learner-a" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          exerciseId: "base-case",
          source: "x".repeat(MAX_JAVASCRIPT_LAB_DRAFT_LENGTH + 1),
        }),
      }),
      context,
    );

    expect(response.status).toBe(400);
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it("does not save an unknown or non-code exercise", async () => {
    getSession.mockResolvedValue({ user: { id: "learner-a" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    saveDraft.mockResolvedValue(null);
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ exerciseId: "not-real", source: "code" }),
      }),
      context,
    );

    expect(response.status).toBe(404);
  });
});

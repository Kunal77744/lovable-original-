import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveJavaScriptLabExerciseCompletion } from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";
import { POST } from "./route";

vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue(new Headers()) }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/db/javascript-lab-progress", () => ({ saveJavaScriptLabExerciseCompletion: vi.fn() }));

const getSession = vi.mocked(auth.api.getSession);
const saveCompletion = vi.mocked(saveJavaScriptLabExerciseCompletion);
const context = { params: Promise.resolve({ labSlug: "tracing" }) };

describe("POST /api/practice/labs/[labSlug]/progress", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects signed-out writes before touching learner data", async () => {
    getSession.mockResolvedValue(null);
    const response = await POST(new Request("http://localhost", { method: "POST", body: "{}" }), context);
    expect(response.status).toBe(401);
    expect(saveCompletion).not.toHaveBeenCalled();
  });

  it("saves only against the signed-in account", async () => {
    getSession.mockResolvedValue({ user: { id: "learner-a" } } as Awaited<ReturnType<typeof auth.api.getSession>>);
    saveCompletion.mockResolvedValue({ completedAt: "2026-08-05T00:00:00.000Z" });
    const response = await POST(new Request("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ exerciseId: "assignment-order" }),
    }), context);
    expect(response.status).toBe(200);
    expect(saveCompletion).toHaveBeenCalledWith("learner-a", "tracing", "assignment-order");
  });

  it("does not create progress for an unknown exercise", async () => {
    getSession.mockResolvedValue({ user: { id: "learner-a" } } as Awaited<ReturnType<typeof auth.api.getSession>>);
    saveCompletion.mockResolvedValue(null);
    const response = await POST(new Request("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ exerciseId: "not-real" }),
    }), context);
    expect(response.status).toBe(404);
  });
});

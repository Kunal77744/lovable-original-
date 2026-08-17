import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getJavaScriptLabExerciseAttemptNote,
  saveJavaScriptLabExerciseAttemptNote,
} from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";
import { GET, POST } from "./route";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/db/javascript-lab-progress", () => ({
  getJavaScriptLabExerciseAttemptNote: vi.fn(),
  saveJavaScriptLabExerciseAttemptNote: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getNote = vi.mocked(getJavaScriptLabExerciseAttemptNote);
const saveNote = vi.mocked(saveJavaScriptLabExerciseAttemptNote);
const context = {
  params: Promise.resolve({ labSlug: "functions", exerciseId: "pass-arguments" }),
};

describe("guided JavaScript attempt note API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ user: { id: "learner-one" } } as never);
  });

  it("restores the exact exercise note for the signed-in account", async () => {
    getNote.mockResolvedValue({
      content: "Inspect the return branch next.",
      updatedAt: "2026-08-17T10:00:00.000Z",
    });

    const response = await GET(
      new Request(
        "http://localhost/api/practice/labs/functions/pass-arguments/note",
      ),
      context,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      note: {
        content: "Inspect the return branch next.",
        updatedAt: "2026-08-17T10:00:00.000Z",
      },
    });
    expect(getNote).toHaveBeenCalledWith(
      "learner-one",
      "functions",
      "pass-arguments",
    );
  });

  it("saves the exact note under the signed-in account and exercise", async () => {
    const content = "  Undefined result.\nNext: inspect the return branch.\n";
    saveNote.mockResolvedValue({
      content,
      updatedAt: "2026-08-17T10:05:00.000Z",
    });

    const response = await POST(
      new Request(
        "http://localhost/api/practice/labs/functions/pass-arguments/note",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        },
      ),
      context,
    );

    expect(response.status).toBe(200);
    expect(saveNote).toHaveBeenCalledWith(
      "learner-one",
      "functions",
      "pass-arguments",
      content,
    );
  });

  it("rejects invalid exercise scopes before writing", async () => {
    const response = await POST(
      new Request(
        "http://localhost/api/practice/labs/functions/not-an-exercise/note",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Try another branch." }),
        },
      ),
      {
        params: Promise.resolve({
          labSlug: "functions",
          exerciseId: "not-an-exercise",
        }),
      },
    );

    expect(response.status).toBe(404);
    expect(saveNote).not.toHaveBeenCalled();
  });

  it("rejects blank notes before writing", async () => {
    const response = await POST(
      new Request(
        "http://localhost/api/practice/labs/functions/pass-arguments/note",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "  " }),
        },
      ),
      context,
    );

    expect(response.status).toBe(400);
    expect(saveNote).not.toHaveBeenCalled();
  });

  it("rejects signed-out reads and writes before touching private notes", async () => {
    getSession.mockResolvedValue(null);

    const [readResponse, writeResponse] = await Promise.all([
      GET(
        new Request(
          "http://localhost/api/practice/labs/functions/pass-arguments/note",
        ),
        context,
      ),
      POST(
        new Request(
          "http://localhost/api/practice/labs/functions/pass-arguments/note",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: "Inspect the return branch." }),
          },
        ),
        context,
      ),
    ]);

    expect([readResponse.status, writeResponse.status]).toEqual([401, 401]);
    expect(getNote).not.toHaveBeenCalled();
    expect(saveNote).not.toHaveBeenCalled();
  });
});

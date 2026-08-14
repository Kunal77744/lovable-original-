import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCssPracticeAttemptNoteForStudent,
  saveCssPracticeAttemptNote,
} from "@/db/css-practice";
import { auth } from "@/lib/auth";
import { GET, POST } from "./route";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/db/css-practice", () => ({
  getCssPracticeAttemptNoteForStudent: vi.fn(),
  saveCssPracticeAttemptNote: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getNote = vi.mocked(getCssPracticeAttemptNoteForStudent);
const saveNote = vi.mocked(saveCssPracticeAttemptNote);
const context = { params: Promise.resolve({ challengeSlug: "class-selector" }) };

describe("CSS attempt note API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ user: { id: "learner-one" } } as never);
  });

  it("restores the exact challenge note for the signed-in account", async () => {
    getNote.mockResolvedValue({
      content: "Try the class selector next.",
      updatedAt: "2026-08-14T20:00:00.000Z",
    });

    const response = await GET(
      new Request("http://localhost/api/practice/css/class-selector/note"),
      context,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      note: {
        content: "Try the class selector next.",
        updatedAt: "2026-08-14T20:00:00.000Z",
      },
    });
    expect(getNote).toHaveBeenCalledWith("learner-one", "class-selector");
  });

  it("saves the exact note under the signed-in account and challenge", async () => {
    const content = "  The nested link still inherits.\nNext: target the link.\n";
    saveNote.mockResolvedValue({
      content,
      updatedAt: "2026-08-14T20:05:00.000Z",
    });

    const response = await POST(
      new Request("http://localhost/api/practice/css/class-selector/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }),
      context,
    );

    expect(response.status).toBe(200);
    expect(saveNote).toHaveBeenCalledWith(
      "learner-one",
      "class-selector",
      content,
    );
  });

  it("rejects blank notes before writing", async () => {
    const response = await POST(
      new Request("http://localhost/api/practice/css/class-selector/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "  " }),
      }),
      context,
    );

    expect(response.status).toBe(400);
    expect(saveNote).not.toHaveBeenCalled();
  });

  it("rejects signed-out reads and writes before touching private notes", async () => {
    getSession.mockResolvedValue(null);

    const [readResponse, writeResponse] = await Promise.all([
      GET(
        new Request("http://localhost/api/practice/css/class-selector/note"),
        context,
      ),
      POST(
        new Request("http://localhost/api/practice/css/class-selector/note", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Try the class selector." }),
        }),
        context,
      ),
    ]);

    expect([readResponse.status, writeResponse.status]).toEqual([401, 401]);
    expect(getNote).not.toHaveBeenCalled();
    expect(saveNote).not.toHaveBeenCalled();
  });
});

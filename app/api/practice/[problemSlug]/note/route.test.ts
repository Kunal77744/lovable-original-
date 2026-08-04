import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  saveCodingProblemNote: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/db/coding-practice", () => ({
  saveCodingProblemNote: mocks.saveCodingProblemNote,
}));

import { POST } from "./route";

const routeContext = {
  params: Promise.resolve({ problemSlug: "sum-two-numbers" }),
};

function noteRequest(content: string) {
  return new Request("http://localhost/api/practice/sum-two-numbers/note", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

describe("practice solution note route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects signed-out saves before touching private notes", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await POST(noteRequest("My private reflection"), routeContext);

    expect(response.status).toBe(401);
    expect(mocks.saveCodingProblemNote).not.toHaveBeenCalled();
  });

  it("scopes exact notes to the current account", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "student-a" } });
    mocks.saveCodingProblemNote.mockResolvedValue({
      status: "saved",
      note: {
        content: "  Split, convert, then add.\n",
        updatedAt: "2026-08-04T08:00:00.000Z",
      },
    });

    const response = await POST(
      noteRequest("  Split, convert, then add.\n"),
      routeContext,
    );

    expect(response.status).toBe(200);
    expect(mocks.saveCodingProblemNote).toHaveBeenCalledWith(
      "student-a",
      "sum-two-numbers",
      "  Split, convert, then add.\n",
    );
    await expect(response.json()).resolves.toMatchObject({
      note: { content: "  Split, convert, then add.\n" },
    });
  });

  it("requires an Accepted result before creating a note", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "student-a" } });
    mocks.saveCodingProblemNote.mockResolvedValue({
      status: "accepted_required",
    });

    const response = await POST(noteRequest("I am not done yet."), routeContext);

    expect(response.status).toBe(403);
    expect(mocks.saveCodingProblemNote).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid content before saving", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "student-a" } });

    const response = await POST(noteRequest("   "), routeContext);

    expect(response.status).toBe(400);
    expect(mocks.saveCodingProblemNote).not.toHaveBeenCalled();
  });
});

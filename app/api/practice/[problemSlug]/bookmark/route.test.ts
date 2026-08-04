import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  removeCodingProblemBookmark: vi.fn(),
  saveCodingProblemBookmark: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/db/coding-practice", () => ({
  removeCodingProblemBookmark: mocks.removeCodingProblemBookmark,
  saveCodingProblemBookmark: mocks.saveCodingProblemBookmark,
}));

import { POST } from "./route";

function bookmarkRequest(bookmarked: boolean) {
  return new Request("http://localhost/api/practice/sum-two-numbers/bookmark", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookmarked }),
  });
}

const routeContext = {
  params: Promise.resolve({ problemSlug: "sum-two-numbers" }),
};

describe("practice bookmark route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects signed-out changes before touching private bookmarks", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await POST(bookmarkRequest(true), routeContext);

    expect(response.status).toBe(401);
    expect(mocks.saveCodingProblemBookmark).not.toHaveBeenCalled();
    expect(mocks.removeCodingProblemBookmark).not.toHaveBeenCalled();
  });

  it("scopes saves and removals to the current account", async () => {
    mocks.getSession
      .mockResolvedValueOnce({ user: { id: "student-a" } })
      .mockResolvedValueOnce({ user: { id: "student-b" } });
    mocks.saveCodingProblemBookmark.mockResolvedValue({ bookmarked: true });
    mocks.removeCodingProblemBookmark.mockResolvedValue({ bookmarked: false });

    const saveResponse = await POST(bookmarkRequest(true), routeContext);
    const removeResponse = await POST(bookmarkRequest(false), routeContext);

    expect(saveResponse.status).toBe(200);
    expect(removeResponse.status).toBe(200);
    expect(mocks.saveCodingProblemBookmark).toHaveBeenCalledWith(
      "student-a",
      "sum-two-numbers",
    );
    expect(mocks.removeCodingProblemBookmark).toHaveBeenCalledWith(
      "student-b",
      "sum-two-numbers",
    );
  });

  it("returns not found for an unknown problem", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "student-a" } });
    mocks.saveCodingProblemBookmark.mockResolvedValue(null);

    const response = await POST(bookmarkRequest(true), {
      params: Promise.resolve({ problemSlug: "missing-problem" }),
    });

    expect(response.status).toBe(404);
  });
});

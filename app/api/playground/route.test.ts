import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getPlaygroundFile: vi.fn(),
  savePlaygroundFile: vi.fn(),
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

vi.mock("@/db/javascript-playground", () => ({
  getPlaygroundFile: mocks.getPlaygroundFile,
  savePlaygroundFile: mocks.savePlaygroundFile,
}));

import { GET, POST } from "./route";

describe("playground route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects signed-out reads and writes before touching private files", async () => {
    mocks.getSession.mockResolvedValue(null);

    const readResponse = await GET();
    const writeResponse = await POST(
      new Request("http://localhost/api/playground", {
        method: "POST",
        body: JSON.stringify({ code: "console.log('private')" }),
      }),
    );

    expect(readResponse.status).toBe(401);
    expect(writeResponse.status).toBe(401);
    expect(mocks.getPlaygroundFile).not.toHaveBeenCalled();
    expect(mocks.savePlaygroundFile).not.toHaveBeenCalled();
  });

  it("scopes every restored file to the current account", async () => {
    mocks.getSession
      .mockResolvedValueOnce({ user: { id: "student-a" } })
      .mockResolvedValueOnce({ user: { id: "student-b" } });
    mocks.getPlaygroundFile
      .mockResolvedValueOnce({
        code: "console.log('student a')",
        quickChecks: "studentAOnly() === true",
        updatedAt: "2026-07-27T03:00:00.000Z",
      })
      .mockResolvedValueOnce({
        code: "console.log('student b')",
        quickChecks: "studentBOnly() === true",
        updatedAt: "2026-07-27T03:01:00.000Z",
      });

    const firstResponse = await GET();
    const secondResponse = await GET();

    await expect(firstResponse.json()).resolves.toMatchObject({
      file: {
        code: "console.log('student a')",
        quickChecks: "studentAOnly() === true",
      },
    });
    await expect(secondResponse.json()).resolves.toMatchObject({
      file: {
        code: "console.log('student b')",
        quickChecks: "studentBOnly() === true",
      },
    });
    expect(mocks.getPlaygroundFile).toHaveBeenNthCalledWith(1, "student-a");
    expect(mocks.getPlaygroundFile).toHaveBeenNthCalledWith(2, "student-b");
  });

  it("saves exact code and quick checks for the signed-in account only", async () => {
    const code = "  const exact = true;\nconsole.log(exact);  ";
    const quickChecks = "exact === true\nexact !== false";
    mocks.getSession.mockResolvedValue({ user: { id: "student-a" } });
    mocks.savePlaygroundFile.mockResolvedValue({
      code,
      quickChecks,
      updatedAt: "2026-07-27T03:02:00.000Z",
    });

    const response = await POST(
      new Request("http://localhost/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, quickChecks }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.savePlaygroundFile).toHaveBeenCalledWith(
      "student-a",
      code,
      quickChecks,
    );
    expect(mocks.savePlaygroundFile).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toMatchObject({
      file: { code, quickChecks },
    });
  });

  it("rejects more than six quick checks before saving private work", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "student-a" } });

    const response = await POST(
      new Request("http://localhost/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "const ready = true;",
          quickChecks: Array.from(
            { length: 7 },
            (_, index) => `ready === ${index === 0 ? "true" : "false"}`,
          ).join("\n"),
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Run up to 6 quick checks at a time.",
    });
    expect(mocks.savePlaygroundFile).not.toHaveBeenCalled();
  });
});

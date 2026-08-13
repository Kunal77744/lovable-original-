import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getPlaygroundWorkspace: vi.fn(),
  savePlaygroundFile: vi.fn(),
  createPlaygroundFile: vi.fn(),
  activatePlaygroundFile: vi.fn(),
  renamePlaygroundFile: vi.fn(),
  deletePlaygroundFile: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/db/javascript-playground", () => ({
  getPlaygroundWorkspace: mocks.getPlaygroundWorkspace,
  savePlaygroundFile: mocks.savePlaygroundFile,
  createPlaygroundFile: mocks.createPlaygroundFile,
  activatePlaygroundFile: mocks.activatePlaygroundFile,
  renamePlaygroundFile: mocks.renamePlaygroundFile,
  deletePlaygroundFile: mocks.deletePlaygroundFile,
  PlaygroundWorkspaceError: class PlaygroundWorkspaceError extends Error {
    constructor(
      public readonly code: "file_limit" | "file_missing" | "last_file",
      message: string,
    ) {
      super(message);
    }
  },
}));

import { DELETE, GET, PATCH, POST } from "./route";

function request(method: string, payload: unknown) {
  return new Request("http://localhost/api/playground", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

describe("playground route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects every signed-out operation before touching private files", async () => {
    mocks.getSession.mockResolvedValue(null);

    const responses = await Promise.all([
      GET(),
      POST(request("POST", { code: "console.log('private')" })),
      PATCH(request("PATCH", { action: "create", name: "arrays.js" })),
      DELETE(request("DELETE", { fileId: "file-1" })),
    ]);

    expect(responses.map((response) => response.status)).toEqual([
      401, 401, 401, 401,
    ]);
    expect(mocks.getPlaygroundWorkspace).not.toHaveBeenCalled();
    expect(mocks.savePlaygroundFile).not.toHaveBeenCalled();
    expect(mocks.createPlaygroundFile).not.toHaveBeenCalled();
    expect(mocks.deletePlaygroundFile).not.toHaveBeenCalled();
  });

  it("scopes every restored workspace to the current account", async () => {
    mocks.getSession
      .mockResolvedValueOnce({ user: { id: "student-a" } })
      .mockResolvedValueOnce({ user: { id: "student-b" } });
    mocks.getPlaygroundWorkspace
      .mockResolvedValueOnce({ files: [{ name: "a.js" }], activeFileId: "a" })
      .mockResolvedValueOnce({ files: [{ name: "b.js" }], activeFileId: "b" });

    await expect((await GET()).json()).resolves.toMatchObject({
      workspace: { files: [{ name: "a.js" }] },
    });
    await expect((await GET()).json()).resolves.toMatchObject({
      workspace: { files: [{ name: "b.js" }] },
    });
    expect(mocks.getPlaygroundWorkspace).toHaveBeenNthCalledWith(1, "student-a");
    expect(mocks.getPlaygroundWorkspace).toHaveBeenNthCalledWith(2, "student-b");
  });

  it("saves the exact selected file for the signed-in account", async () => {
    const code = "  const exact = true;\nconsole.log(exact);  ";
    const quickChecks = "exact === true\nexact !== false";
    mocks.getSession.mockResolvedValue({ user: { id: "student-a" } });
    mocks.savePlaygroundFile.mockResolvedValue({ id: "file-2", code, quickChecks });

    const response = await POST(
      request("POST", { fileId: "file-2", code, quickChecks }),
    );

    expect(response.status).toBe(200);
    expect(mocks.savePlaygroundFile).toHaveBeenCalledWith(
      "student-a",
      "file-2",
      code,
      quickChecks,
    );
  });

  it("creates, activates, renames, and deletes only account-scoped files", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "student-a" } });
    mocks.createPlaygroundFile.mockResolvedValue({ id: "file-2" });
    mocks.activatePlaygroundFile.mockResolvedValue({ id: "file-2" });
    mocks.renamePlaygroundFile.mockResolvedValue({ id: "file-2", name: "loops.js" });
    mocks.deletePlaygroundFile.mockResolvedValue({
      deletedFileId: "file-2",
      activeFile: { id: "file-1" },
    });

    expect(
      (await PATCH(request("PATCH", { action: "create", name: "arrays" }))).status,
    ).toBe(200);
    expect(
      (await PATCH(
        request("PATCH", { action: "activate", fileId: "file-2" }),
      )).status,
    ).toBe(200);
    expect(
      (await PATCH(
        request("PATCH", {
          action: "rename",
          fileId: "file-2",
          name: "loops",
        }),
      )).status,
    ).toBe(200);
    expect(
      (await DELETE(request("DELETE", { fileId: "file-2" }))).status,
    ).toBe(200);

    expect(mocks.createPlaygroundFile).toHaveBeenCalledWith(
      "student-a",
      "arrays.js",
    );
    expect(mocks.activatePlaygroundFile).toHaveBeenCalledWith(
      "student-a",
      "file-2",
    );
    expect(mocks.renamePlaygroundFile).toHaveBeenCalledWith(
      "student-a",
      "file-2",
      "loops.js",
    );
    expect(mocks.deletePlaygroundFile).toHaveBeenCalledWith(
      "student-a",
      "file-2",
    );
  });

  it("rejects invalid file names and more than six quick checks", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "student-a" } });

    const invalidName = await PATCH(
      request("PATCH", { action: "create", name: "../private.js" }),
    );
    const tooManyChecks = await POST(
      request("POST", {
        fileId: "file-1",
        code: "const ready = true;",
        quickChecks: Array.from(
          { length: 7 },
          (_, index) => `ready === ${index === 0 ? "true" : "false"}`,
        ).join("\n"),
      }),
    );

    expect(invalidName.status).toBe(400);
    expect(tooManyChecks.status).toBe(400);
    expect(mocks.createPlaygroundFile).not.toHaveBeenCalled();
    expect(mocks.savePlaygroundFile).not.toHaveBeenCalled();
  });
});

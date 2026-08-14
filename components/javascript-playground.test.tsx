import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_PLAYGROUND_CODE_LENGTH } from "@/lib/javascript-playground";
import { JavaScriptPlayground } from "./javascript-playground";

const runPlaygroundCode = vi.fn();
const runPlaygroundChecks = vi.fn();

vi.mock("@/lib/coding-runner", () => ({
  runPlaygroundCode: (...args: unknown[]) => runPlaygroundCode(...args),
  runPlaygroundChecks: (...args: unknown[]) => runPlaygroundChecks(...args),
}));

function playgroundFiles(
  code: string,
  quickChecks = "",
  updatedAt: string | null = null,
) {
  return [
    {
      id: "file-1",
      name: "playground.js",
      code,
      quickChecks,
      updatedAt,
      isActive: true,
    },
  ];
}

function createJavaScriptFile(name: string, source: string) {
  const file = new File([source], name, { type: "text/javascript" });
  Object.defineProperty(file, "text", {
    configurable: true,
    value: vi.fn().mockResolvedValue(source),
  });
  return file;
}

describe("JavaScriptPlayground", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.restoreAllMocks();
    runPlaygroundCode.mockReset();
    runPlaygroundChecks.mockReset();
  });

  it("runs the exact editor source from the keyboard and announces the result", async () => {
    let finishRun:
      | ((result: { status: "finished"; output: string[] }) => void)
      | undefined;
    runPlaygroundCode.mockReturnValue(
      new Promise((resolve) => {
        finishRun = resolve;
      }),
    );
    render(
      <JavaScriptPlayground
        initialFiles={playgroundFiles("console.log('answer', 42);")}
        initialActiveFileId="file-1"
      />,
    );

    const editor = screen.getByRole("textbox", { name: "JavaScript file" });
    editor.focus();
    fireEvent.keyDown(editor, { key: "Enter", ctrlKey: true });

    expect(runPlaygroundCode).toHaveBeenCalledWith(
      "console.log('answer', 42);",
    );
    const status = screen
      .getByText("Running in an isolated browser worker…")
      .closest('[role="status"]');
    expect(status).not.toBeNull();
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(status).toHaveTextContent("Running in an isolated browser worker");

    await act(async () => {
      finishRun?.({ status: "finished", output: ["answer 42"] });
    });

    expect(status).toHaveTextContent("answer 42");
    expect(status).toHaveTextContent("Finished without an uncaught error.");
  });

  it("shows the existing keyboard shortcut beside the Run control", () => {
    render(
      <JavaScriptPlayground
        initialFiles={playgroundFiles("console.log('shortcut');")}
        initialActiveFileId="file-1"
      />,
    );

    const actions = screen
      .getByText("Keyboard: Ctrl/⌘ + Enter")
      .closest(".playground-actions");
    expect(actions).not.toBeNull();
    expect(actions).toContainElement(
      screen.getByRole("button", { name: "Run code" }),
    );
  });

  it("imports one local JavaScript file into only the open editor as unsaved work", async () => {
    const importedCode = "const imported = [1, 2, 3].map((value) => value * 2);";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          file: {
            ...playgroundFiles(importedCode, "imported.length === 3")[0],
            updatedAt: "2026-08-14T02:00:00.000Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    render(
      <JavaScriptPlayground
        initialFiles={playgroundFiles(
          "console.log('saved source');",
          "imported.length === 3",
          "2026-08-14T01:00:00.000Z",
        )}
        initialActiveFileId="file-1"
      />,
    );

    fireEvent.change(
      screen.getByLabelText(
        "Choose JavaScript file to import into the open playground file",
      ),
      {
        target: {
          files: [createJavaScriptFile("array-notes.js", importedCode)],
        },
      },
    );
    await act(async () => {
      await Promise.resolve();
    });

    const editor = screen.getByRole("textbox", { name: "JavaScript file" });
    expect(editor).toHaveValue("console.log('saved source');");
    expect(
      screen.getByText("Import array-notes.js into playground.js?"),
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Import file" }));

    expect(editor).toHaveValue(importedCode);
    expect(
      screen.getByRole("textbox", { name: "Quick check expressions" }),
    ).toHaveValue("imported.length === 3");
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(
      screen.getByText(
        "array-notes.js is now unsaved work in playground.js. Quick checks and the saved file are unchanged.",
      ),
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(runPlaygroundCode).not.toHaveBeenCalled();
    expect(runPlaygroundChecks).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Save file" }));

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/playground",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            fileId: "file-1",
            code: importedCode,
            quickChecks: "imported.length === 3",
          }),
        }),
      ),
    );
  });

  it("keeps the open editor and Quick checks untouched when import is cancelled", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(
      <JavaScriptPlayground
        initialFiles={playgroundFiles(
          "console.log('keep source');",
          "true",
          "2026-08-14T01:00:00.000Z",
        )}
        initialActiveFileId="file-1"
      />,
    );

    fireEvent.change(
      screen.getByLabelText(
        "Choose JavaScript file to import into the open playground file",
      ),
      {
        target: {
          files: [
            createJavaScriptFile(
              "replacement.js",
              "console.log('replacement');",
            ),
          ],
        },
      },
    );
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole("button", { name: "Keep editor" }));

    expect(screen.getByRole("textbox", { name: "JavaScript file" })).toHaveValue(
      "console.log('keep source');",
    );
    expect(
      screen.getByRole("textbox", { name: "Quick check expressions" }),
    ).toHaveValue("true");
    expect(screen.getByText("Saved to your account")).toBeInTheDocument();
    expect(
      screen.getByText("Import cancelled. playground.js was not changed."),
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects multiple, wrong-type, oversized, empty, and unreadable imports", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(
      <JavaScriptPlayground
        initialFiles={playgroundFiles(
          "console.log('keep exact source');",
          "true",
          "2026-08-14T01:00:00.000Z",
        )}
        initialActiveFileId="file-1"
      />,
    );
    const input = screen.getByLabelText(
      "Choose JavaScript file to import into the open playground file",
    );

    fireEvent.change(input, {
      target: {
        files: [
          createJavaScriptFile("one.js", "return 1;"),
          createJavaScriptFile("two.js", "return 2;"),
        ],
      },
    });
    expect(
      screen.getByText("Choose one JavaScript file at a time."),
    ).toBeInTheDocument();

    fireEvent.change(input, {
      target: { files: [createJavaScriptFile("notes.txt", "return 1;")] },
    });
    expect(screen.getByText("Choose a file ending in .js.")).toBeInTheDocument();

    fireEvent.change(input, {
      target: {
        files: [
          createJavaScriptFile(
            "too-large.js",
            "x".repeat(MAX_PLAYGROUND_CODE_LENGTH + 1),
          ),
        ],
      },
    });
    expect(
      screen.getByText(
        `Keep imported files to ${MAX_PLAYGROUND_CODE_LENGTH.toLocaleString()} bytes or fewer.`,
      ),
    ).toBeInTheDocument();

    fireEvent.change(input, {
      target: { files: [createJavaScriptFile("empty.js", "")] },
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(
      screen.getByText(
        "That file is empty. Choose a .js file with source code.",
      ),
    ).toBeInTheDocument();

    const unreadableFile = createJavaScriptFile("unreadable.js", "source");
    Object.defineProperty(unreadableFile, "text", {
      configurable: true,
      value: vi.fn().mockRejectedValue(new Error("File read failed")),
    });
    fireEvent.change(input, { target: { files: [unreadableFile] } });
    await act(async () => {
      await Promise.resolve();
    });
    expect(
      screen.getByText(
        "That file could not be read. The open editor was not changed.",
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole("textbox", { name: "JavaScript file" })).toHaveValue(
      "console.log('keep exact source');",
    );
    expect(
      screen.getByRole("textbox", { name: "Quick check expressions" }),
    ).toHaveValue("true");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(runPlaygroundCode).not.toHaveBeenCalled();
    expect(runPlaygroundChecks).not.toHaveBeenCalled();
  });

  it("creates the first private file without leaving a duplicate starter tab", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          file: {
            id: "file-1",
            name: "arrays.js",
            code: "const topic = \"semantic HTML\";",
            quickChecks: "",
            updatedAt: "2026-08-13T03:30:00.000Z",
            isActive: true,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    render(
      <JavaScriptPlayground
        initialFiles={[
          {
            ...playgroundFiles("const topic = \"semantic HTML\";")[0],
            id: null,
          },
        ]}
        initialActiveFileId={null}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "New file" }), {
      target: { value: "arrays" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create file" }));

    expect(await screen.findByRole("tab", { name: "arrays.js" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getAllByRole("tab")).toHaveLength(1);
    expect(screen.getByText("1 of 6")).toBeInTheDocument();
  });

  it("switches, renames, and deletes an exact account-backed file", async () => {
    const firstFile = playgroundFiles(
      "console.log('first');",
      "",
      "2026-08-13T03:20:00.000Z",
    )[0];
    const secondFile = {
      ...firstFile,
      id: "file-2",
      name: "arrays.js",
      code: "console.log('arrays');",
      isActive: false,
    };
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ file: { ...secondFile, isActive: true } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            file: { ...secondFile, name: "loops.js", isActive: true },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            deletedFileId: "file-2",
            activeFile: { ...firstFile, isActive: true },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    render(
      <JavaScriptPlayground
        initialFiles={[firstFile, secondFile]}
        initialActiveFileId="file-1"
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "arrays.js" }));
    expect(
      await screen.findByDisplayValue("console.log('arrays');"),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("textbox", { name: "Current filename" }),
      { target: { value: "loops" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Rename" }));
    expect(await screen.findByRole("tab", { name: "loops.js" })).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "Delete current file" }),
    );
    expect(
      await screen.findByDisplayValue("console.log('first');"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "loops.js" })).not.toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/playground",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ action: "activate", fileId: "file-2" }),
      }),
    );
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      3,
      "/api/playground",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ fileId: "file-2" }),
      }),
    );
  });

  it("loads an Accepted copy only after confirmation and keeps it unsaved", () => {
    render(
      <JavaScriptPlayground
        initialFiles={playgroundFiles(
          "console.log('current playground');",
          "currentCheck() === true",
          "2026-08-13T01:00:00.000Z",
        )}
        initialActiveFileId="file-1"
        acceptedTransfer={{
          problemSlug: "even-or-odd",
          problemTitle: "Even or odd",
          source:
            "function solve(input) { return Number(input) % 2 === 0 ? 'Even' : 'Odd'; }",
        }}
      />,
    );

    expect(screen.getByRole("textbox", { name: "JavaScript file" })).toHaveValue(
      "console.log('current playground');",
    );
    expect(
      screen.getByRole("textbox", { name: "Quick check expressions" }),
    ).toHaveValue("currentCheck() === true");
    expect(screen.getByText("Saved to your account")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Replace editor with copy" }),
    );

    expect(screen.getByRole("textbox", { name: "JavaScript file" })).toHaveValue(
      "function solve(input) { return Number(input) % 2 === 0 ? 'Even' : 'Odd'; }",
    );
    expect(
      screen.getByRole("textbox", { name: "Quick check expressions" }),
    ).toHaveValue("");
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(screen.getByText(/Loaded from Even or odd\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to problem" })).toHaveAttribute(
      "href",
      "/practice/even-or-odd",
    );
  });

  it("keeps the current playground file when the Accepted copy is declined", () => {
    render(
      <JavaScriptPlayground
        initialFiles={playgroundFiles(
          "console.log('keep me');",
          "true",
          "2026-08-13T01:00:00.000Z",
        )}
        initialActiveFileId="file-1"
        acceptedTransfer={{
          problemSlug: "sum-two-numbers",
          problemTitle: "Sum two numbers",
          source: "function solve(input) { return input; }",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Keep current file" }));

    expect(screen.getByRole("textbox", { name: "JavaScript file" })).toHaveValue(
      "console.log('keep me');",
    );
    expect(screen.queryByText("Experiment beyond the judge")).not.toBeInTheDocument();
    expect(screen.getByText("Saved to your account")).toBeInTheDocument();
  });

  it("saves only the confirmed Accepted copy and cleared checks", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          file: {
            ...playgroundFiles("function solve() {}", "", "2026-08-13T01:10:00.000Z")[0],
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    const transferredSource =
      "function solve(input) { return String(Number(input) * 2); }";
    render(
      <JavaScriptPlayground
        initialFiles={playgroundFiles(
          "console.log('old');",
          "oldCheck()",
          "2026-08-13T01:00:00.000Z",
        )}
        initialActiveFileId="file-1"
        acceptedTransfer={{
          problemSlug: "double-a-number",
          problemTitle: "Double a number",
          source: transferredSource,
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Replace editor with copy" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save file" }));

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/playground",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            fileId: "file-1",
            code: transferredSource,
            quickChecks: "",
          }),
        }),
      ),
    );
  });

  it("runs learner-authored checks against the exact editor source", async () => {
    runPlaygroundChecks.mockResolvedValue({
      status: "finished",
      checks: [
        { expression: "double(4) === 8", passed: true, message: null },
        { expression: "double(0) === 0", passed: true, message: null },
      ],
    });
    render(
      <JavaScriptPlayground
        initialFiles={playgroundFiles(
          "const double = (value) => value * 2;",
        )}
        initialActiveFileId="file-1"
      />,
    );

    fireEvent.change(
      screen.getByRole("textbox", { name: "Quick check expressions" }),
      { target: { value: "double(4) === 8\ndouble(0) === 0" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Run quick checks" }));

    await waitFor(() =>
      expect(runPlaygroundChecks).toHaveBeenCalledWith(
        "const double = (value) => value * 2;",
        ["double(4) === 8", "double(0) === 0"],
      ),
    );
    expect(await screen.findByText("2 of 2 checks passed.")).toBeVisible();
    expect(screen.getAllByText("Passed")).toHaveLength(2);
    expect(screen.getByText("double(4) === 8")).toBeVisible();
  });

  it("keeps failed and broken expressions visible for the next attempt", async () => {
    runPlaygroundChecks.mockResolvedValue({
      status: "finished",
      checks: [
        { expression: "double(4) === 10", passed: false, message: null },
        {
          expression: "missing(2) === 2",
          passed: false,
          message: "missing is not defined",
        },
      ],
    });
    render(
      <JavaScriptPlayground
        initialFiles={playgroundFiles(
          "const double = (value) => value * 2;",
        )}
        initialActiveFileId="file-1"
      />,
    );

    fireEvent.change(
      screen.getByRole("textbox", { name: "Quick check expressions" }),
      { target: { value: "double(4) === 10\nmissing(2) === 2" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Run quick checks" }));

    expect(await screen.findByText("0 of 2 checks passed.")).toBeVisible();
    expect(screen.getAllByText("Needs work")).toHaveLength(2);
    expect(screen.getByText("missing is not defined")).toBeVisible();
  });

  it.each([
    {
      name: "an uncaught error",
      result: {
        status: "error",
        output: ["before error"],
        message: "ReferenceError: missingValue is not defined",
      },
      expected: "ReferenceError: missingValue is not defined",
    },
    {
      name: "the one-second timeout",
      result: {
        status: "timeout",
        output: [],
        message: "Execution stopped after 1,000 ms.",
      },
      expected: "Execution stopped after 1,000 ms.",
    },
  ])("announces $name through the same status region", async ({
    result,
    expected,
  }) => {
    runPlaygroundCode.mockResolvedValue(result);
    render(
      <JavaScriptPlayground
        initialFiles={playgroundFiles("while (true) {}")}
        initialActiveFileId="file-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Run code" }));

    const status = (await screen.findByText(expected)).closest('[role="status"]');
    expect(status).not.toBeNull();
    await waitFor(() => expect(status).toHaveTextContent(expected));
  });

  it("announces saving and the saved account-backed state", async () => {
    const exactCode = "  const exact = true;\nconsole.log(exact);  ";
    let finishSave: ((response: Response) => void) | undefined;
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      new Promise((resolve) => {
        finishSave = resolve;
      }),
    );
    render(
      <JavaScriptPlayground
        initialFiles={playgroundFiles(
          exactCode,
          "double(4) === 8\ndouble(0) === 0",
        )}
        initialActiveFileId="file-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save file" }));

    const saveStatus = screen.getByText("Saving…").closest('[role="status"]');
    expect(saveStatus).not.toBeNull();
    expect(saveStatus).toHaveAttribute("aria-live", "polite");
    expect(saveStatus).toHaveAttribute("aria-atomic", "true");
    expect(screen.getByRole("button", { name: "Saving file…" })).toBeDisabled();

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/playground",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            fileId: "file-1",
            code: exactCode,
            quickChecks: "double(4) === 8\ndouble(0) === 0",
          }),
        }),
      ),
    );

    await act(async () => {
      finishSave?.(
        new Response(
          JSON.stringify({
            file: {
              id: "file-1",
              name: "playground.js",
              code: exactCode,
              quickChecks: "double(4) === 8\ndouble(0) === 0",
              updatedAt: "2026-07-27T03:02:00.000Z",
              isActive: true,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    });

    expect(saveStatus).toHaveTextContent("Saved to your account");
  });

  it("keeps newer code unsaved when an older save finishes", async () => {
    const savedVersion = "console.log('saved version');";
    const newerVersion = "console.log('newer unsaved version');";
    let finishFirstSave: ((response: Response) => void) | undefined;
    vi.spyOn(globalThis, "fetch").mockReturnValueOnce(
      new Promise((resolve) => {
        finishFirstSave = resolve;
      }),
    ).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          file: {
            id: "file-1",
            name: "playground.js",
            code: newerVersion,
            quickChecks: "",
            updatedAt: "2026-08-06T16:30:00.000Z",
            isActive: true,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    render(
      <JavaScriptPlayground
        initialFiles={playgroundFiles(savedVersion)}
        initialActiveFileId="file-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save file" }));
    fireEvent.change(screen.getByRole("textbox", { name: "JavaScript file" }), {
      target: { value: newerVersion },
    });

    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saving file…" })).toBeDisabled();

    await act(async () => {
      finishFirstSave?.(
        new Response(
          JSON.stringify({
            file: {
              id: "file-1",
              name: "playground.js",
              code: savedVersion,
              quickChecks: "",
              updatedAt: "2026-08-06T16:29:00.000Z",
              isActive: true,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    });

    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save file" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Save file" }));

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenLastCalledWith(
        "/api/playground",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            fileId: "file-1",
            code: newerVersion,
            quickChecks: "",
          }),
        }),
      ),
    );
    expect(await screen.findByText("Saved to your account")).toBeInTheDocument();
  });

  it.each([
    {
      name: "the server rejects the save",
      save: () =>
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
          new Response(JSON.stringify({ error: "Could not save." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }),
        ),
    },
    {
      name: "the network request fails",
      save: () =>
        vi
          .spyOn(globalThis, "fetch")
          .mockRejectedValue(new Error("Network unavailable")),
    },
  ])("announces a save failure when $name", async ({ save }) => {
    save();
    render(
      <JavaScriptPlayground
        initialFiles={playgroundFiles("console.log('keep this exact code');")}
        initialActiveFileId="file-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save file" }));

    const failure = await screen.findByText("Save failed");
    const saveStatus = failure.closest('[role="status"]');
    expect(saveStatus).not.toBeNull();
    expect(saveStatus).toHaveAttribute("aria-atomic", "true");
    expect(saveStatus).toHaveTextContent("Save failed");
  });
});

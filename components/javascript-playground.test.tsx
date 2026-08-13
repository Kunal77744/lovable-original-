import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

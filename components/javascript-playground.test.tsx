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
        initialCode="console.log('answer', 42);"
        initialUpdatedAt={null}
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
        initialCode="console.log('shortcut');"
        initialUpdatedAt={null}
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
        initialCode="const double = (value) => value * 2;"
        initialUpdatedAt={null}
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
        initialCode="const double = (value) => value * 2;"
        initialUpdatedAt={null}
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
        initialCode="while (true) {}"
        initialUpdatedAt={null}
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
      <JavaScriptPlayground initialCode={exactCode} initialUpdatedAt={null} />,
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
          body: JSON.stringify({ code: exactCode }),
        }),
      ),
    );

    await act(async () => {
      finishSave?.(
        new Response(
          JSON.stringify({
            file: {
              code: exactCode,
              updatedAt: "2026-07-27T03:02:00.000Z",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    });

    expect(saveStatus).toHaveTextContent("Saved to your account");
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
        initialCode="console.log('keep this exact code');"
        initialUpdatedAt={null}
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

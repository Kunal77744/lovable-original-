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

vi.mock("@/lib/coding-runner", () => ({
  runPlaygroundCode: (...args: unknown[]) => runPlaygroundCode(...args),
}));

describe("JavaScriptPlayground", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.restoreAllMocks();
    runPlaygroundCode.mockReset();
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
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(status).toHaveTextContent("Running in an isolated browser worker");
    expect(screen.getAllByRole("status")).toHaveLength(1);

    await act(async () => {
      finishRun?.({ status: "finished", output: ["answer 42"] });
    });

    expect(status).toHaveTextContent("answer 42");
    expect(status).toHaveTextContent("Finished without an uncaught error.");
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

    const status = await screen.findByRole("status");
    await waitFor(() => expect(status).toHaveTextContent(expected));
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("saves the exact file and reports account-backed state", async () => {
    const exactCode = "  const exact = true;\nconsole.log(exact);  ";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
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
    render(
      <JavaScriptPlayground initialCode={exactCode} initialUpdatedAt={null} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save file" }));

    expect(
      await screen.findByText("Saved to your account"),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/playground",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ code: exactCode }),
        }),
      ),
    );
  });
});

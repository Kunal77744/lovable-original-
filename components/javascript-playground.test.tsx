import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("runs the exact editor source and renders console output", async () => {
    runPlaygroundCode.mockResolvedValue({
      status: "finished",
      output: ["answer 42"],
    });
    render(
      <JavaScriptPlayground
        initialCode="console.log('answer', 42);"
        initialUpdatedAt={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Run code" }));

    expect(await screen.findByText("answer 42")).toBeInTheDocument();
    expect(runPlaygroundCode).toHaveBeenCalledWith(
      "console.log('answer', 42);",
    );
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

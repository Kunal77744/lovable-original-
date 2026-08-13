import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getEmptyJavaScriptCapstoneChecks,
  JAVASCRIPT_CAPSTONE_STARTER,
  type JavaScriptCapstoneRecord,
} from "@/lib/javascript-capstone";
import { JavaScriptCapstoneWorkspace } from "./javascript-capstone-workspace";

const mocks = vi.hoisted(() => ({
  runCodingSolution: vi.fn(),
  captureProjectCompleted: vi.fn(),
}));

vi.mock("@/lib/coding-runner", () => ({
  runCodingSolution: (...args: unknown[]) => mocks.runCodingSolution(...args),
}));

vi.mock("@/lib/product-analytics", () => ({
  captureProjectCompleted: mocks.captureProjectCompleted,
}));

const starterProject: JavaScriptCapstoneRecord = {
  code: JAVASCRIPT_CAPSTONE_STARTER,
  saved: false,
  updatedAt: null,
  hasUnreviewedChanges: false,
  submission: null,
};

describe("JavaScriptCapstoneWorkspace", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.runCodingSolution.mockReset();
    mocks.captureProjectCompleted.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("offers the exact saved project file only while the editor matches it", () => {
    render(
      <JavaScriptCapstoneWorkspace
        projectSlug="javascript-expense-report"
        initialProject={{ ...starterProject, saved: true }}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Download expense-report.js" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("JavaScript project"), {
      target: { value: `${JAVASCRIPT_CAPSTONE_STARTER}\n// newer work` },
    });
    expect(
      screen.queryByRole("button", { name: "Download expense-report.js" }),
    ).not.toBeInTheDocument();
  });

  it("keeps newer code visibly unsaved when an older save finishes", async () => {
    let resolveSave: ((value: Response) => void) | undefined;
    const firstRevision = `${JAVASCRIPT_CAPSTONE_STARTER}\n// first revision`;
    const newerRevision = `${firstRevision}\n// newer revision`;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        new Promise<Response>((resolve) => {
          resolveSave = resolve;
        }),
      ),
    );

    render(
      <JavaScriptCapstoneWorkspace
        projectSlug="javascript-expense-report"
        initialProject={starterProject}
      />,
    );

    const editor = screen.getByLabelText("JavaScript project");
    fireEvent.change(editor, { target: { value: firstRevision } });
    fireEvent.click(screen.getByRole("button", { name: "Save now" }));
    fireEvent.change(editor, { target: { value: newerRevision } });

    resolveSave?.({
      ok: true,
      json: async () => ({
        ...starterProject,
        code: firstRevision,
        saved: true,
        updatedAt: "2026-08-07T01:00:00.000Z",
      }),
    } as Response);

    await waitFor(() =>
      expect(
        screen.getByText("Your saved draft is safe. Newer code is still unsaved."),
      ).toBeInTheDocument(),
    );
    expect(editor).toHaveValue(newerRevision);
    expect(screen.getByText("Unsaved")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save now" })).toBeEnabled();
  });

  it("saves the latest private draft after typing pauses", async () => {
    vi.useFakeTimers();
    const editedCode = `${JAVASCRIPT_CAPSTONE_STARTER}\n// autosaved revision`;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...starterProject,
        code: editedCode,
        saved: true,
        updatedAt: "2026-08-09T18:00:00.000Z",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <JavaScriptCapstoneWorkspace
        projectSlug="javascript-expense-report"
        initialProject={starterProject}
      />,
    );
    fireEvent.change(screen.getByLabelText("JavaScript project"), {
      target: { value: editedCode },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/projects/javascript-expense-report",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "save", code: editedCode }),
      }),
    );
    expect(screen.getByText("Saved privately to your account.")).toBeInTheDocument();
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("keeps a failed autosave retryable without clearing the editor", async () => {
    vi.useFakeTimers();
    const editedCode = `${JAVASCRIPT_CAPSTONE_STARTER}\n// keep this revision`;
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    render(
      <JavaScriptCapstoneWorkspace
        projectSlug="javascript-expense-report"
        initialProject={starterProject}
      />,
    );
    const editor = screen.getByLabelText("JavaScript project");
    fireEvent.change(editor, { target: { value: editedCode } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    expect(editor).toHaveValue(editedCode);
    expect(
      screen.getByText(
        "The draft could not be saved. Check your connection and try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Unsaved")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save now" })).toBeEnabled();
  });

  it("queues the exact newer draft while an autosave is in flight", async () => {
    vi.useFakeTimers();
    let resolveFirstSave: ((value: Response) => void) | undefined;
    const firstRevision = `${JAVASCRIPT_CAPSTONE_STARTER}\n// first autosave`;
    const newerRevision = `${firstRevision}\n// newer autosave`;
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(
        new Promise<Response>((resolve) => {
          resolveFirstSave = resolve;
        }),
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...starterProject,
          code: newerRevision,
          saved: true,
          updatedAt: "2026-08-09T18:01:00.000Z",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <JavaScriptCapstoneWorkspace
        projectSlug="javascript-expense-report"
        initialProject={starterProject}
      />,
    );
    const editor = screen.getByLabelText("JavaScript project");
    fireEvent.change(editor, { target: { value: firstRevision } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    fireEvent.change(editor, { target: { value: newerRevision } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    await act(async () => {
      resolveFirstSave?.({
        ok: true,
        json: async () => ({
          ...starterProject,
          code: firstRevision,
          saved: true,
          updatedAt: "2026-08-09T18:00:00.000Z",
        }),
      } as Response);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        body: JSON.stringify({ action: "save", code: newerRevision }),
      }),
    );
    expect(editor).toHaveValue(newerRevision);
    expect(screen.getByText("Saved privately to your account.")).toBeInTheDocument();
  });

  it("turns a failed review into one bounded first repair", async () => {
    const checks = getEmptyJavaScriptCapstoneChecks().map((check, index) => ({
      ...check,
      passed: index === 0,
    }));
    mocks.runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: Array.from({ length: 6 }, () => "wrong"),
      logs: [],
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...starterProject,
          saved: true,
          submission: {
            status: "needs-revision",
            checks,
            passedChecks: 1,
            totalChecks: 6,
            submittedAt: "2026-08-07T01:00:00.000Z",
          },
        }),
      }),
    );

    render(
      <JavaScriptCapstoneWorkspace
        projectSlug="javascript-expense-report"
        initialProject={starterProject}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Submit for review" }));

    await waitFor(() =>
      expect(screen.getByText("1/6 passing")).toBeInTheDocument(),
    );
    expect(screen.getByText("First outcome to repair")).toBeInTheDocument();
    expect(screen.getAllByText("Add every expense")).toHaveLength(2);
    expect(
      screen.getByText(/Review saved. 1 of 6 outcomes pass/),
    ).toBeInTheDocument();
  });

  it("teaches one reusable principle after a saved 6 of 6 review", () => {
    const checks = getEmptyJavaScriptCapstoneChecks().map((check) => ({
      ...check,
      passed: true,
    }));
    render(
      <JavaScriptCapstoneWorkspace
        projectSlug="javascript-expense-report"
        initialProject={{
          ...starterProject,
          saved: true,
          submission: {
            status: "completed",
            checks,
            passedChecks: 6,
            totalChecks: 6,
            submittedAt: "2026-08-07T01:00:00.000Z",
          },
        }}
      />,
    );

    expect(screen.getByText("What this proves")).toBeInTheDocument();
    expect(
      screen.getByText("Separate parsing, transforming, and formatting."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open project debrief" }),
    ).toHaveAttribute("href", "/projects/javascript-expense-report/debrief");
    expect(
      screen.getByRole("link", { name: "Return to your JavaScript record" }),
    ).toHaveAttribute("href", "/practice/progress");
  });
});

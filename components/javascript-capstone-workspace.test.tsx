import {
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

  afterEach(() => cleanup());

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
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
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
    expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled();
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
      screen.getByRole("link", { name: "Return to your JavaScript record" }),
    ).toHaveAttribute("href", "/practice/progress");
  });
});

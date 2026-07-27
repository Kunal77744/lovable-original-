import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CodingWorkspace } from "./coding-workspace";

const runCodingSolution = vi.fn();
const capturePracticeProblemAccepted = vi.fn();

vi.mock("@/lib/coding-runner", () => ({
  runCodingSolution: (...args: unknown[]) => runCodingSolution(...args),
}));

vi.mock("@/lib/product-analytics", () => ({
  capturePracticeProblemAccepted: (...args: unknown[]) =>
    capturePracticeProblemAccepted(...args),
}));

const problem = {
  slug: "sum-two-numbers",
  title: "Sum two numbers",
  tests: [{ input: "4 9" }, { input: "-8 3" }, { input: "0 0" }, { input: "120 880" }],
  example: {
    input: "4 9",
    expectedOutput: "13",
  },
};

describe("CodingWorkspace", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.restoreAllMocks();
    runCodingSolution.mockReset();
    capturePracticeProblemAccepted.mockReset();
  });

  it("runs a public example in the browser without saving", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["13"],
    });

    render(
      <CodingWorkspace
        attempts={[]}
        bestVerdict={null}
        initialCode="function solve() { return '13'; }"
        isSignedIn={false}
        problem={problem}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Run example" }));

    expect(await screen.findByText("Example passed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in to submit" })).toHaveAttribute(
      "href",
      expect.stringContaining("/account?mode=signin"),
    );
  });

  it("submits all outputs and renders a saved Accepted verdict", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["13", "-5", "0", "1000"],
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "attempt-1",
          verdict: "Accepted",
          bestVerdict: "Accepted",
          passedTests: 4,
          totalTests: 4,
          completedCount: 1,
          totalCount: 6,
          createdAt: "2026-07-26T22:30:00.000Z",
          isFirstAcceptedResult: true,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(
      <CodingWorkspace
        attempts={[]}
        bestVerdict={null}
        initialCode="function solve(input) { return input; }"
        isSignedIn
        problem={problem}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit solution" }));

    expect((await screen.findAllByText("Accepted")).length).toBeGreaterThan(0);
    expect(screen.getByText("Practice progress · 1/6 accepted")).toBeInTheDocument();
    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/practice/sum-two-numbers",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    expect(capturePracticeProblemAccepted).toHaveBeenCalledWith({
      problemSlug: "sum-two-numbers",
      passedCheckCount: 4,
    });
    expect(JSON.stringify(capturePracticeProblemAccepted.mock.calls)).not.toMatch(
      /function solve|code|input|output|email/i,
    );
  });

  it("does not recapture a previously saved Accepted result", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["13", "-5", "0", "1000"],
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "attempt-2",
          verdict: "Accepted",
          bestVerdict: "Accepted",
          passedTests: 4,
          totalTests: 4,
          completedCount: 1,
          totalCount: 6,
          createdAt: "2026-07-26T22:35:00.000Z",
          isFirstAcceptedResult: false,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(
      <CodingWorkspace
        attempts={[]}
        bestVerdict="Accepted"
        initialCode="function solve(input) { return input; }"
        isSignedIn
        problem={problem}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit solution" }));

    expect((await screen.findAllByText("Accepted")).length).toBeGreaterThan(0);
    expect(capturePracticeProblemAccepted).not.toHaveBeenCalled();
  });
});

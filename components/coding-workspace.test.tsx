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
  acceptedExplanation: {
    concept: "Parse text before arithmetic",
    whyItWorks:
      "Browser input arrives as text. Converting both tokens to numbers makes addition work for positive values, negatives, and zero.",
    commonMistake:
      'Adding the raw tokens joins strings, so "4" and "9" become "49" instead of 13.',
  },
  tests: [{ input: "4 9" }, { input: "-8 3" }, { input: "0 0" }, { input: "120 880" }],
  example: {
    input: "4 9",
    expectedOutput: "13",
  },
};

function renderWorkspace({
  isSignedIn = true,
}: {
  isSignedIn?: boolean;
} = {}) {
  return render(
    <CodingWorkspace
      attempts={[]}
      bestVerdict={null}
      initialCode="function solve(input) { return input; }"
      isSignedIn={isSignedIn}
      problem={problem}
    />,
  );
}

function submissionResponse(
  verdict: "Accepted" | "Wrong Answer",
  passedTests: number,
) {
  return new Response(
    JSON.stringify({
      id: `attempt-${verdict}`,
      verdict,
      bestVerdict: verdict,
      passedTests,
      totalTests: 4,
      completedCount: verdict === "Accepted" ? 1 : 0,
      totalCount: 6,
      nextProblemSlug: verdict === "Accepted" ? "even-or-odd" : null,
      createdAt: "2026-07-26T22:30:00.000Z",
      isFirstAcceptedResult: verdict === "Accepted",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

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

    renderWorkspace({ isSignedIn: false });

    const runButton = screen.getByRole("button", { name: "Run example" });

    expect(
      screen.getByText("Keyboard: Tab to Run, then Enter"),
    ).toBeInTheDocument();
    expect(runButton).toHaveAttribute(
      "aria-describedby",
      "run-example-keyboard-hint",
    );
    expect(
      screen.getByText(
        "Sign in to save this work. Your code, attempts, and Accepted progress return with your account.",
      ),
    ).toBeInTheDocument();

    runButton.focus();
    fireEvent.click(runButton);

    const status = screen.getByRole("status");
    expect(await screen.findByText("Example passed")).toBeInTheDocument();
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(status).toHaveTextContent(
      "Example passedExample passed. Submit when you’re ready for all four checks.",
    );
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
      submissionResponse("Accepted", 4),
    );

    renderWorkspace();

    const submitButton = screen.getByRole("button", { name: "Submit solution" });
    submitButton.focus();
    fireEvent.click(submitButton);

    const status = await screen.findByRole("status");
    await waitFor(() =>
      expect(status).toHaveTextContent(
        "Accepted4/4 checksSum two numbers is complete. Your code and result are saved.",
      ),
    );
    expect(
      screen.getByRole("link", {
        name: "Continue to next unfinished step",
      }),
    ).toHaveAttribute("href", "/practice/even-or-odd");
    expect(screen.getByText("Practice progress · 1/6 accepted")).toBeInTheDocument();
    expect(screen.getByText("Concept unlocked")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: problem.acceptedExplanation.concept,
      }),
    ).toBeInTheDocument();
    expect(status).toHaveTextContent(problem.acceptedExplanation.whyItWorks);
    expect(screen.getByText("Common mistake")).toBeInTheDocument();
    expect(status).toHaveTextContent(problem.acceptedExplanation.commonMistake);
    expect(
      screen.getByText(
        "Your saved code, attempts, and Accepted progress return after sign-in.",
      ),
    ).toBeInTheDocument();
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

  it("restores the concept explanation with a saved Accepted result", () => {
    render(
      <CodingWorkspace
        attempts={[]}
        bestVerdict="Accepted"
        initialCode="function solve(input) { return input; }"
        isSignedIn
        problem={problem}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: problem.acceptedExplanation.concept,
      }),
    ).toBeInTheDocument();
    const status = screen.getByRole("status");
    expect(status).toHaveClass("is-accepted");
    expect(status).toHaveTextContent("Accepted");
    expect(status).toHaveTextContent(problem.acceptedExplanation.commonMistake);
  });

  it("returns a learner who completes all six problems to the catalog", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["13", "-5", "0", "1000"],
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "attempt-6",
          verdict: "Accepted",
          bestVerdict: "Accepted",
          passedTests: 4,
          totalTests: 4,
          completedCount: 6,
          totalCount: 6,
          nextProblemSlug: null,
          createdAt: "2026-07-27T02:00:00.000Z",
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

    expect(
      await screen.findByRole("link", { name: "View completed path" }),
    ).toHaveAttribute("href", "/practice");
    expect(
      screen.queryByRole("link", {
        name: "Continue to next unfinished step",
      }),
    ).not.toBeInTheDocument();
  });

  it("announces a saved Wrong Answer verdict in the same status region", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["12", "-5", "0", "1000"],
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      submissionResponse("Wrong Answer", 3),
    );

    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Submit solution" }));

    const status = screen.getByRole("status");
    await waitFor(() =>
      expect(status).toHaveTextContent(
        "Wrong Answer3/4 checks3 of 4 checks passed. Your attempt is saved.",
      ),
    );
    expect(screen.queryByText("Concept unlocked")).not.toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it.each([
    {
      runnerStatus: "error",
      message: "Define a function named solve(input).",
      label: "Runner stopped",
    },
    {
      runnerStatus: "timeout",
      message: "Time limit exceeded after 1,000 ms.",
      label: "Time limit exceeded",
    },
  ])("announces a $runnerStatus result", async ({ runnerStatus, message, label }) => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    runCodingSolution.mockResolvedValue({
      status: runnerStatus,
      message,
    });

    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Submit solution" }));

    const status = screen.getByRole("status");
    await waitFor(() => expect(status).toHaveTextContent(`${label}${message}`));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("announces judging while the browser runner is still working", async () => {
    let finishRun:
      | ((result: { status: "finished"; outputs: string[] }) => void)
      | undefined;
    runCodingSolution.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishRun = resolve;
        }),
    );

    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Submit solution" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "JudgingRunning four deterministic checks in your browser…",
    );
    expect(screen.getByRole("button", { name: "Running checks…" })).toBeDisabled();

    finishRun?.({ status: "finished", outputs: ["13", "-5", "0", "1000"] });
  });
});

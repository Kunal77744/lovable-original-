import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CodingTestCase } from "@/lib/coding-test-cases";
import { CodingWorkspace } from "./coding-workspace";

const runCodingSolution = vi.fn();
const captureJavaScriptPracticeCompleted = vi.fn();
const capturePracticeProblemAccepted = vi.fn();
const capturePracticeFeedbackSubmitted = vi.fn();

vi.mock("@/lib/coding-runner", () => ({
  runCodingSolution: (...args: unknown[]) => runCodingSolution(...args),
}));

vi.mock("@/lib/product-analytics", () => ({
  captureJavaScriptPracticeCompleted: (...args: unknown[]) =>
    captureJavaScriptPracticeCompleted(...args),
  capturePracticeProblemAccepted: (...args: unknown[]) =>
    capturePracticeProblemAccepted(...args),
  capturePracticeFeedbackSubmitted: (...args: unknown[]) =>
    capturePracticeFeedbackSubmitted(...args),
}));

const problem = {
  slug: "sum-two-numbers",
  title: "Sum two numbers",
  recoveryHint:
    "Trace both values from the input to the returned number. Check number conversion, zero, and negative signs instead of testing only the sample.",
  recoveryHints: [
    "Inspect the two input tokens before you add them. If either still behaves like text, arithmetic will not produce the intended total.",
    "Use one negative case and the zero case from your private tests. The same conversion and return path should handle both without a special branch.",
  ] as [string, string],
  acceptedExplanation: {
    concept: "Parse text before arithmetic",
    whyItWorks:
      "Browser input arrives as text. Converting both tokens to numbers makes addition work for positive values, negatives, and zero.",
    commonMistake:
      'Adding the raw tokens joins strings, so "4" and "9" become "49" instead of 13.',
  },
  starterCode: `function solve(input) {
  // Read the problem, use input, and return the exact output.
  return "";
}`,
  tests: [{ input: "4 9" }, { input: "-8 3" }, { input: "0 0" }, { input: "120 880" }],
  example: {
    input: "4 9",
    expectedOutput: "13",
  },
};

function renderWorkspace({
  initialCustomTestCases = [],
  initialPracticeFeedback = null,
  isSignedIn = true,
  isPracticeFeedbackEligible = false,
  isReviewSession = false,
  dailyChallengeDate = null,
}: {
  initialCustomTestCases?: CodingTestCase[];
  initialPracticeFeedback?: {
    problemSlug: string;
    usefulness: "not_yet" | "somewhat" | "very";
    comment: string;
    updatedAt: string;
  } | null;
  isSignedIn?: boolean;
  isPracticeFeedbackEligible?: boolean;
  isReviewSession?: boolean;
  dailyChallengeDate?: string | null;
} = {}) {
  return render(
    <CodingWorkspace
      attempts={[]}
      bestVerdict={null}
      initialCode="function solve(input) { return input; }"
      initialCustomTestCases={initialCustomTestCases}
      initialPracticeFeedback={initialPracticeFeedback}
      isSignedIn={isSignedIn}
      isPracticeFeedbackEligible={isPracticeFeedbackEligible}
      isReviewSession={isReviewSession}
      dailyChallengeDate={dailyChallengeDate}
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
      totalCount: 12,
      nextProblemSlug: verdict === "Accepted" ? "even-or-odd" : null,
      createdAt: "2026-07-26T22:30:00.000Z",
      hasSource: true,
      isFirstAcceptedResult: verdict === "Accepted",
      dailyChallengeCompleted: false,
      dailyChallengeDate: null,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

describe("CodingWorkspace", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.restoreAllMocks();
    runCodingSolution.mockReset();
    captureJavaScriptPracticeCompleted.mockReset();
    capturePracticeProblemAccepted.mockReset();
    capturePracticeFeedbackSubmitted.mockReset();
  });

  it("shows the fresh scaffold without offering a destructive restore", () => {
    render(
      <CodingWorkspace
        attempts={[]}
        bestVerdict={null}
        initialCode={problem.starterCode}
        initialPracticeFeedback={null}
        isSignedIn
        isPracticeFeedbackEligible={false}
        problem={problem}
      />,
    );

    expect(screen.getByLabelText("JavaScript solution")).toHaveValue(
      problem.starterCode,
    );
    expect(
      screen.getByRole("button", { name: "Clean starter loaded" }),
    ).toBeDisabled();
  });

  it("opens the private source snapshot behind a saved verdict", () => {
    render(
      <CodingWorkspace
        attempts={[
          {
            id: "attempt-with-source",
            verdict: "Wrong Answer",
            passedTests: 3,
            totalTests: 4,
            createdAt: "2026-08-04T12:00:00.000Z",
            hasSource: true,
          },
        ]}
        bestVerdict="Wrong Answer"
        initialCode="function solve(input) { return input; }"
        initialPracticeFeedback={null}
        isSignedIn
        isPracticeFeedbackEligible={false}
        problem={problem}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Review source for attempt 1" }),
    ).toHaveAttribute("href", "/submissions/attempt-with-source");
    expect(screen.getByLabelText("JavaScript solution")).toHaveValue(
      "function solve(input) { return input; }",
    );
  });

  it("keeps an older verdict truthful when no source snapshot exists", () => {
    render(
      <CodingWorkspace
        attempts={[
          {
            id: "legacy-result",
            verdict: "Accepted",
            passedTests: 4,
            totalTests: 4,
            createdAt: "2026-07-29T02:28:00.000Z",
            hasSource: false,
          },
        ]}
        bestVerdict="Accepted"
        initialCode="function solve(input) { return input; }"
        initialPracticeFeedback={null}
        isSignedIn
        isPracticeFeedbackEligible={false}
        problem={problem}
      />,
    );

    expect(screen.getByText("Result only")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /review source/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps edited code when the restore confirmation is cancelled", () => {
    renderWorkspace();
    const editor = screen.getByLabelText("JavaScript solution");

    fireEvent.click(
      screen.getByRole("button", { name: "Restore clean starter" }),
    );
    expect(screen.getByText("Restore the clean starter?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Keep my code" }));

    expect(editor).toHaveValue("function solve(input) { return input; }");
    expect(
      screen.queryByText("Restore the clean starter?"),
    ).not.toBeInTheDocument();
  });

  it("restores only the editor without saving a draft or adding an attempt", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderWorkspace();
    const editor = screen.getByLabelText("JavaScript solution");

    fireEvent.change(editor, {
      target: { value: "function solve(input) { return 'edited'; }" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Restore clean starter" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Restore starter" }));
    await vi.advanceTimersByTimeAsync(800);

    expect(editor).toHaveValue(problem.starterCode);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(runCodingSolution).not.toHaveBeenCalled();
    expect(screen.getByText("Unsaved")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Clean starter restored in the editor. Your saved code and attempts have not changed.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("No saved submissions yet. Your first verdict will appear here.")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("does not offer account-code restoration to signed-out learners", () => {
    renderWorkspace({ isSignedIn: false });

    expect(
      screen.queryByRole("button", { name: /starter/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Plan the behavior before the syntax.",
      }),
    ).not.toBeInTheDocument();
  });

  it("opens the structured private planning stage before submission", () => {
    renderWorkspace();

    expect(
      screen.getByRole("heading", {
        name: "Plan the behavior before the syntax.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Input shape")).toBeInTheDocument();
    expect(screen.getByLabelText("Edge case")).toBeInTheDocument();
    expect(screen.getByLabelText("Ordered approach")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Post-Accepted reflection"),
    ).not.toBeInTheDocument();
  });

  it("runs a public example in the browser without saving", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["13"],
      debugOutput: ["input 4 9", "numbers [4,9]"],
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
    expect(screen.getByText("Debug console · local only")).toBeInTheDocument();
    expect(screen.getByText(/input 4 9\s+numbers \[4,9\]/)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Sign in to submit" })).toHaveAttribute(
      "href",
      expect.stringContaining("/account?mode=signin"),
    );
  });

  it("saves the exact latest draft when the editor loses focus", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ savedAt: "now" })));
    renderWorkspace();
    const editor = screen.getByRole("textbox", {
      name: "JavaScript solution",
    });
    const latestCode = "function solve(input) { return input.trim(); }";

    fireEvent.change(editor, { target: { value: latestCode } });
    fireEvent.blur(editor);

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/practice/sum-two-numbers",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ mode: "draft", code: latestCode }),
      }),
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("queues the exact pending draft when the learner leaves immediately", async () => {
    const originalSendBeacon = navigator.sendBeacon;
    const sendBeacon = vi.fn((url: string | URL, data?: BodyInit | null) => {
      void url;
      void data;
      return true;
    });
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: sendBeacon,
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const latestCode = "function solve(input) { return input.toUpperCase(); }";

    try {
      renderWorkspace();
      fireEvent.change(
        screen.getByRole("textbox", { name: "JavaScript solution" }),
        { target: { value: latestCode } },
      );
      fireEvent(window, new Event("pagehide"));

      expect(sendBeacon).toHaveBeenCalledTimes(1);
      const [url, body] = sendBeacon.mock.calls[0];
      expect(url).toBe("/api/practice/sum-two-numbers");
      expect(body).toBeInstanceOf(Blob);
      expect((body as Blob).type).toBe("application/json");
      const payload = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error);
        reader.onload = () => resolve(String(reader.result));
        reader.readAsText(body as Blob);
      });
      expect(JSON.parse(payload)).toEqual({ mode: "draft", code: latestCode });
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(navigator, "sendBeacon", {
        configurable: true,
        value: originalSendBeacon,
      });
    }
  });

  it("keeps a signed-out draft local when the learner leaves", () => {
    const originalSendBeacon = navigator.sendBeacon;
    const sendBeacon = vi.fn((url: string | URL, data?: BodyInit | null) => {
      void url;
      void data;
      return true;
    });
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: sendBeacon,
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    try {
      renderWorkspace({ isSignedIn: false });
      const editor = screen.getByRole("textbox", {
        name: "JavaScript solution",
      });
      fireEvent.change(editor, {
        target: { value: "function solve(input) { return input.trim(); }" },
      });
      fireEvent.blur(editor);
      fireEvent(window, new Event("pagehide"));

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(sendBeacon).not.toHaveBeenCalled();
      expect(screen.getByText("Local only")).toBeInTheDocument();
    } finally {
      Object.defineProperty(navigator, "sendBeacon", {
        configurable: true,
        value: originalSendBeacon,
      });
    }
  });

  it("runs editable custom input without saving an attempt", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["42"],
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    renderWorkspace();

    fireEvent.click(screen.getByText("Try your own input"));
    fireEvent.change(screen.getByLabelText("Custom input"), {
      target: { value: "19 23" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run custom input" }));

    expect(await screen.findByText("Custom run")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Custom input finished. Review the output before you submit.",
    );
    expect(runCodingSolution).toHaveBeenCalledWith(
      "function solve(input) { return input; }",
      ["19 23"],
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(
      screen.getByText("No saved submissions yet. Your first verdict will appear here."),
    ).toBeInTheDocument();
  });

  it("restores private test cases without changing attempts or analytics", () => {
    renderWorkspace({
      initialCustomTestCases: [
        { input: "19 23", expectedOutput: "42" },
        { input: "-5 8", expectedOutput: null },
      ],
    });

    fireEvent.click(screen.getByText("Try your own input"));

    expect(screen.getByText("2/6")).toBeInTheDocument();
    expect(screen.getByLabelText("Test case 1 input")).toHaveValue("19 23");
    expect(screen.getByLabelText("Expected output")).toHaveValue("42");
    expect(screen.getByDisplayValue("-5 8")).toBeInTheDocument();
    expect(screen.getByText("2 private test cases restored.")).toBeInTheDocument();
    expect(
      screen.getByText("No saved submissions yet. Your first verdict will appear here."),
    ).toBeInTheDocument();
    expect(runCodingSolution).not.toHaveBeenCalled();
    expect(capturePracticeProblemAccepted).not.toHaveBeenCalled();
    expect(captureJavaScriptPracticeCompleted).not.toHaveBeenCalled();
  });

  it("runs every private test case together without saving an attempt", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["42", "3", ""],
      debugOutput: ["checking 19 23", "checking -5 8", "checking 0 0"],
    });
    renderWorkspace({
      initialCustomTestCases: [
        { input: "19 23", expectedOutput: "42" },
        { input: "-5 8", expectedOutput: "4" },
        { input: "0 0", expectedOutput: "" },
      ],
    });

    fireEvent.click(screen.getByText("Try your own input"));
    fireEvent.click(screen.getByRole("button", { name: "Run all 3 cases" }));

    expect(
      await screen.findByText("Private test suite"),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "2 of 3 expected outputs matched.",
    );
    expect(
      screen.getByRole("list", { name: "Private test suite outputs" }),
    ).toHaveTextContent("Case 1Input19 23Output42Expected42Matched");
    expect(
      screen.getByRole("list", { name: "Private test suite outputs" }),
    ).toHaveTextContent("Case 2Input-5 8Output3Expected4Mismatch");
    expect(
      screen.getByRole("list", { name: "Private test suite outputs" }),
    ).toHaveTextContent("Case 3Input0 0Output(empty)Expected(empty)Matched");
    expect(screen.getByText("Debug console · local only")).toBeInTheDocument();
    expect(runCodingSolution).toHaveBeenCalledWith(
      "function solve(input) { return input; }",
      ["19 23", "-5 8", "0 0"],
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(capturePracticeProblemAccepted).not.toHaveBeenCalled();
    expect(captureJavaScriptPracticeCompleted).not.toHaveBeenCalled();
    expect(
      screen.getByText("No saved submissions yet. Your first verdict will appear here."),
    ).toBeInTheDocument();
  });

  it("reports an unchecked case separately from an expected empty output", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["", ""],
      debugOutput: [],
    });
    renderWorkspace({
      initialCustomTestCases: [
        { input: "blank", expectedOutput: null },
        { input: "empty", expectedOutput: "" },
      ],
    });

    fireEvent.click(screen.getByText("Try your own input"));
    fireEvent.click(screen.getByRole("button", { name: "Run all 2 cases" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "1 of 1 expected output matched. 1 case ran without an expectation.",
    );
    const results = screen.getByRole("list", {
      name: "Private test suite outputs",
    });
    expect(results).toHaveTextContent(
      "Case 1InputblankOutput(empty)ExpectedNot checkedNo expectation",
    );
    expect(results).toHaveTextContent(
      "Case 2InputemptyOutput(empty)Expected(empty)Matched",
    );
  });

  it("saves the current custom input privately without running or submitting it", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          testCases: {
            cases: [{ input: "19 23", expectedOutput: null }],
            updatedAt: "2026-08-04T10:00:00.000Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    renderWorkspace();

    fireEvent.click(screen.getByText("Try your own input"));
    fireEvent.change(screen.getByLabelText("Custom input"), {
      target: { value: "19 23" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save test case" }));

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/practice/sum-two-numbers/test-cases",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            cases: [{ input: "19 23", expectedOutput: null }],
          }),
        }),
      ),
    );
    expect(await screen.findByText("1 private test case saved.")).toBeInTheDocument();
    expect(screen.getByLabelText("Test case 1 input")).toHaveValue("19 23");
    expect(runCodingSolution).not.toHaveBeenCalled();
    expect(capturePracticeProblemAccepted).not.toHaveBeenCalled();
    expect(captureJavaScriptPracticeCompleted).not.toHaveBeenCalled();
    expect(
      screen.getByText("No saved submissions yet. Your first verdict will appear here."),
    ).toBeInTheDocument();
  });

  it("revises and removes a private test case", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            testCases: {
              cases: [{ input: "21 21", expectedOutput: "42" }],
              updatedAt: "2026-08-04T10:00:00.000Z",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            testCases: {
              cases: [],
              updatedAt: "2026-08-04T10:01:00.000Z",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    renderWorkspace({
      initialCustomTestCases: [{ input: "19 23", expectedOutput: null }],
    });

    fireEvent.click(screen.getByText("Try your own input"));
    fireEvent.change(screen.getByLabelText("Test case 1 input"), {
      target: { value: "21 21" },
    });
    fireEvent.click(screen.getByLabelText("Check expected output"));
    fireEvent.change(screen.getByLabelText("Expected output"), {
      target: { value: "42" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("1 private test case saved.")).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      "/api/practice/sum-two-numbers/test-cases",
      expect.objectContaining({
        body: JSON.stringify({
          cases: [{ input: "21 21", expectedOutput: "42" }],
        }),
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(await screen.findByText("All private test cases removed.")).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "/api/practice/sum-two-numbers/test-cases",
      expect.objectContaining({ body: JSON.stringify({ cases: [] }) }),
    );
    expect(screen.getByText("No saved cases yet. Try an input above, then save it here.")).toBeInTheDocument();
  });

  it("keeps signed-out custom runs local and hides private saving controls", () => {
    renderWorkspace({ isSignedIn: false });

    fireEvent.click(screen.getByText("Try your own input"));

    expect(screen.getByRole("button", { name: "Run custom input" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save test case" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Private test cases" })).not.toBeInTheDocument();
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
    expect(screen.getByText("Practice progress · 1/12 accepted")).toBeInTheDocument();
    expect(screen.getByText("Concept unlocked")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: problem.acceptedExplanation.concept,
      }),
    ).toBeInTheDocument();
    expect(status).toHaveTextContent(problem.acceptedExplanation.whyItWorks);
    expect(screen.getByText("Common mistake")).toBeInTheDocument();
    expect(status).toHaveTextContent(problem.acceptedExplanation.commonMistake);
    expect(screen.getByText("Private code review")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "What your Accepted source already shows",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Seen in your source")).toBeInTheDocument();
    expect(screen.getByText("Checks proved")).toBeInTheDocument();
    expect(screen.getByText("Keep testing")).toBeInTheDocument();
    expect(screen.getByText("Only you")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open private problem debrief" }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers/debrief");
    expect(
      screen.getByRole("heading", {
        name: "Compare your plan with what passed.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Post-Accepted reflection")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your saved code, attempts, and Accepted progress return after sign-in.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Try this next")).not.toBeInTheDocument();
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
    expect(
      screen.getByRole("heading", {
        name: "Was this practice step useful?",
      }),
    ).toBeInTheDocument();
  });

  it("returns an Accepted review retry to the refreshed private session first", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["13", "-5", "0", "1000"],
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      submissionResponse("Accepted", 4),
    );

    renderWorkspace({ isReviewSession: true });
    fireEvent.click(screen.getByRole("button", { name: "Submit solution" }));

    expect(
      await screen.findByRole("link", { name: "Return to refreshed review" }),
    ).toHaveAttribute("href", "/practice/review");
    expect(
      screen.getByRole("link", {
        name: "Continue to next unfinished step",
      }),
    ).toHaveAttribute("href", "/practice/even-or-odd");
    expect(
      screen.getByRole("link", { name: "Return to refreshed review" }),
    ).toHaveClass("accepted-next-action");
    expect(
      screen.getByRole("link", {
        name: "Continue to next unfinished step",
      }),
    ).toHaveClass("accepted-secondary-action");
  });

  it("sends the current daily context and confirms only the saved Accepted result", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["13", "-5", "0", "1000"],
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "daily-accepted",
          verdict: "Accepted",
          bestVerdict: "Accepted",
          passedTests: 4,
          totalTests: 4,
          completedCount: 1,
          totalCount: 12,
          nextProblemSlug: "even-or-odd",
          createdAt: "2026-08-08T12:00:00.000Z",
          hasSource: true,
          isFirstAcceptedResult: true,
          dailyChallengeCompleted: true,
          dailyChallengeDate: "2026-08-08",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    renderWorkspace({ dailyChallengeDate: "2026-08-08" });
    fireEvent.click(screen.getByRole("button", { name: "Submit solution" }));

    expect(
      await screen.findByText(
        "Sum two numbers is complete. Today’s daily challenge is saved.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Return to today’s challenge" }),
    ).toHaveAttribute("href", "/practice/daily");
    const request = fetchSpy.mock.calls.find(
      ([url]) => url === "/api/practice/sum-two-numbers",
    );
    expect(request?.[1]).toEqual(
      expect.objectContaining({
        body: JSON.stringify({
          mode: "submit",
          code: "function solve(input) { return input; }",
          outputs: ["13", "-5", "0", "1000"],
          dailyChallengeDate: "2026-08-08",
        }),
      }),
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
          completedCount: 12,
          totalCount: 12,
          nextProblemSlug: null,
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
        initialAcceptedCode="function solve(input) { const [a, b] = input.split(' ').map(Number); return String(a + b); }"
        initialCode="function solve(input) { const [a, b] = input.split(' ').map(Number); return String(a + b); }"
        initialPracticeFeedback={null}
        isSignedIn
        isPracticeFeedbackEligible={false}
        problem={problem}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit solution" }));

    expect((await screen.findAllByText("Accepted")).length).toBeGreaterThan(0);
    expect(capturePracticeProblemAccepted).not.toHaveBeenCalled();
    expect(captureJavaScriptPracticeCompleted).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("heading", {
        name: "Was this practice step useful?",
      }),
    ).not.toBeInTheDocument();
  });

  it("restores the concept explanation with a saved Accepted result", () => {
    render(
      <CodingWorkspace
        attempts={[]}
        bestVerdict="Accepted"
        initialAcceptedCode="function solve(input) { const [a, b] = input.split(' ').map(Number); return String(a + b); }"
        initialCode="function solve(input) { const [a, b] = input.split(' ').map(Number); return String(a + b); }"
        initialPracticeFeedback={null}
        isSignedIn
        isPracticeFeedbackEligible={false}
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
    expect(screen.getByText("Private code review")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open private problem debrief" }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers/debrief");
    expect(status).toHaveTextContent(
      "Your source explicitly turns input text into numbers before adding the two values.",
    );
  });

  it("keeps the private review hidden before Accepted and while signed out", () => {
    const acceptedSource =
      "function solve(input) { const [a, b] = input.split(' ').map(Number); return String(a + b); }";

    const signedInView = render(
      <CodingWorkspace
        attempts={[]}
        bestVerdict={null}
        initialAcceptedCode={null}
        initialCode={acceptedSource}
        initialPracticeFeedback={null}
        isSignedIn
        isPracticeFeedbackEligible={false}
        problem={problem}
      />,
    );

    expect(screen.queryByText("Private code review")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Open private problem debrief" }),
    ).not.toBeInTheDocument();
    signedInView.unmount();

    render(
      <CodingWorkspace
        attempts={[]}
        bestVerdict="Accepted"
        initialAcceptedCode={acceptedSource}
        initialCode={acceptedSource}
        initialPracticeFeedback={null}
        isSignedIn={false}
        isPracticeFeedbackEligible={false}
        problem={problem}
      />,
    );

    expect(screen.queryByText("Private code review")).not.toBeInTheDocument();
  });

  it("returns a learner who completes all 12 problems to the catalog", async () => {
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
          completedCount: 12,
          totalCount: 12,
          nextProblemSlug: null,
          createdAt: "2026-07-27T02:00:00.000Z",
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
        initialPracticeFeedback={null}
        isSignedIn
        isPracticeFeedbackEligible={false}
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
    expect(captureJavaScriptPracticeCompleted).toHaveBeenCalledOnce();
    expect(captureJavaScriptPracticeCompleted).toHaveBeenCalledWith({
      pathSlug: "beginner-javascript",
      completionState: "completed",
    });
    expect(JSON.stringify(captureJavaScriptPracticeCompleted.mock.calls)).not.toMatch(
      /function solve|code|input|output|email/i,
    );
  });

  it("recovers the private response on the first Accepted problem", () => {
    renderWorkspace({
      isPracticeFeedbackEligible: true,
      initialPracticeFeedback: {
        problemSlug: problem.slug,
        usefulness: "somewhat",
        comment: "The examples made the loop click.",
        updatedAt: "2026-07-29T03:00:00.000Z",
      },
    });

    expect(
      screen.getByRole("heading", {
        name: "Was this practice step useful?",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Somewhat")).toBeChecked();
    expect(
      screen.getByDisplayValue("The examples made the loop click."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Update response" }),
    ).toBeInTheDocument();
  });

  it("reveals bounded recovery hints after a saved Wrong Answer", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["12", "-5", "0", "1000"],
    });
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(submissionResponse("Wrong Answer", 3)),
    );

    renderWorkspace({ isReviewSession: true });
    fireEvent.click(screen.getByRole("button", { name: "Submit solution" }));

    const status = screen.getByRole("status");
    await waitFor(() =>
      expect(status).toHaveTextContent(
        "Wrong Answer3/4 checks3 of 4 checks passed. Your attempt is saved.",
      ),
    );
    expect(screen.getByText("Try this next")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Return to refreshed review" }),
    ).not.toBeInTheDocument();
    expect(status).toHaveTextContent(problem.recoveryHint);
    expect(screen.queryByText(problem.recoveryHints[0])).not.toBeInTheDocument();
    expect(screen.queryByText(problem.recoveryHints[1])).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Show another hint" }),
    );

    expect(screen.getByText(problem.recoveryHints[0])).toBeInTheDocument();
    expect(screen.queryByText(problem.recoveryHints[1])).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show final hint" }));

    expect(screen.getByText(problem.recoveryHints[1])).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /show .*hint/i }),
    ).not.toBeInTheDocument();
    expect(status).toHaveTextContent(
      "All hints shown. Return to your code and try one change at a time.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit solution" }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Show another hint" }),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText(problem.recoveryHints[0])).not.toBeInTheDocument();
    expect(screen.queryByText(problem.recoveryHints[1])).not.toBeInTheDocument();
    expect(screen.queryByText("Concept unlocked")).not.toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it.each([
    {
      runnerStatus: "error",
      message: "Define a function named solve(input).",
      label: "Runner stopped",
      recoveryLabel: "Check the required function",
      recoveryGuidance:
        "Keep solve(input) at the top level and return the final answer from it. Then run the example again.",
    },
    {
      runnerStatus: "error",
      message: "Unexpected token '}'",
      label: "Runner stopped",
      recoveryLabel: "Check the syntax",
      recoveryGuidance:
        "Inspect the line before the reported token for an unmatched quote, bracket, parenthesis, or comma.",
    },
    {
      runnerStatus: "error",
      message: "missingValue is not defined",
      label: "Runner stopped",
      recoveryLabel: "Trace the first missing value",
      recoveryGuidance:
        "Find the first named value in the message, then check where it should be created before it is used.",
    },
    {
      runnerStatus: "timeout",
      message: "Time limit exceeded after 1,000 ms.",
      label: "Time limit exceeded",
      recoveryLabel: "Check the stopping condition",
      recoveryGuidance:
        "Try the smallest input first. Make sure every loop changes the value that eventually stops it.",
    },
  ])("announces a $runnerStatus result with recovery", async ({
    runnerStatus,
    message,
    label,
    recoveryLabel,
    recoveryGuidance,
  }) => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    runCodingSolution.mockResolvedValue({
      status: runnerStatus,
      message,
    });

    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Submit solution" }));

    const status = screen.getByRole("status");
    await waitFor(() => expect(status).toHaveTextContent(`${label}${message}`));
    expect(status).toHaveTextContent(recoveryLabel);
    expect(status).toHaveTextContent(recoveryGuidance);
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

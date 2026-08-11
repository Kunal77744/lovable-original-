import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCssPracticeChallenge,
  gradeCssPracticeChallenge,
} from "@/lib/css-practice-challenges";
import { CssChallengeWorkspace } from "./css-challenge-workspace";

const captureCssPracticeCompleted = vi.fn();
const captureCssPathFeedbackSubmitted = vi.fn();

vi.mock("@/lib/product-analytics", () => ({
  captureCssPracticeCompleted: (...args: unknown[]) =>
    captureCssPracticeCompleted(...args),
  captureCssPathFeedbackSubmitted: (...args: unknown[]) =>
    captureCssPathFeedbackSubmitted(...args),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  captureCssPracticeCompleted.mockReset();
  captureCssPathFeedbackSubmitted.mockReset();
  vi.restoreAllMocks();
});

const challenge = getCssPracticeChallenge("class-selector")!;

describe("CssChallengeWorkspace", () => {
  it("marks an account-backed draft as saved before the first attempt", () => {
    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        challenge={{
          slug: challenge.slug,
          title: challenge.title,
          checks: gradeCssPracticeChallenge(
            challenge.slug,
            challenge.starterCss,
          )!,
          successTakeaway: challenge.successTakeaway,
        }}
        hasSavedDraft
        initialCss=".learning-card { color: #287652; }"
        isSignedIn
        nextChallengeSlug="class-selector"
      />,
    );

    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your saved CSS draft is restored. Submit when you want deterministic feedback.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "No saved attempts yet. Your first submission will appear here.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps a signed-out attempt local and offers account creation", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        challenge={{
          slug: challenge.slug,
          title: challenge.title,
          checks: gradeCssPracticeChallenge(
            challenge.slug,
            challenge.starterCss,
          )!,
          successTakeaway: challenge.successTakeaway,
        }}
        initialCss={challenge.starterCss}
        isSignedIn={false}
        nextChallengeSlug="class-selector"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Check and save attempt" }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/create a free account to check and save/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create account" }),
    ).toHaveAttribute("href", "/account");
    expect(
      screen.queryByRole("heading", {
        name: challenge.successTakeaway.concept,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Did this path make CSS clearer?" }),
    ).not.toBeInTheDocument();
  });

  it("saves an attempt, renders exact checks, and continues to the next step", async () => {
    const completedCss = `.learning-card {
      background: #ffffff;
      color: #17231e;
    }`;
    const checks = gradeCssPracticeChallenge(challenge.slug, completedCss)!;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "attempt-one",
        verdict: "Completed",
        bestVerdict: "Completed",
        checks,
        passedChecks: 3,
        totalChecks: 3,
        completedCount: 1,
        totalCount: 6,
        nextChallengeSlug: "descendant-selector",
        createdAt: "2026-08-02T00:00:00.000Z",
        isFirstCompletedResult: true,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        challenge={{
          slug: challenge.slug,
          title: challenge.title,
          checks: gradeCssPracticeChallenge(challenge.slug, completedCss)!,
          successTakeaway: challenge.successTakeaway,
        }}
        initialCss={completedCss}
        isSignedIn
        nextChallengeSlug="class-selector"
      />,
    );
    expect(
      screen.queryByRole("heading", {
        name: challenge.successTakeaway.concept,
      }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Check and save attempt" }),
    );

    await waitFor(() =>
      expect(screen.getByText(/CSS and result are saved/i)).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/practice/css/class-selector",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ mode: "submit", css: completedCss }),
      }),
    );
    expect(screen.getAllByText("Completed")).toHaveLength(2);
    expect(
      screen.getByRole("heading", {
        name: challenge.successTakeaway.concept,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(challenge.successTakeaway.explanation),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /continue to the next unfinished challenge/i,
      }),
    ).toHaveAttribute("href", "/practice/css/descendant-selector");
    expect(captureCssPracticeCompleted).not.toHaveBeenCalled();
  });

  it("serializes delayed draft saves and confirms only the latest CSS", async () => {
    vi.useFakeTimers();
    const firstCss = ".learning-card { color: #17231e; }";
    const latestCss = ".learning-card { color: #287652; }";
    let resolveFirst!: (value: Response) => void;
    let resolveLatest!: (value: Response) => void;
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(
        new Promise<Response>((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockReturnValueOnce(
        new Promise<Response>((resolve) => {
          resolveLatest = resolve;
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        challenge={{
          slug: challenge.slug,
          title: challenge.title,
          checks: gradeCssPracticeChallenge(
            challenge.slug,
            challenge.starterCss,
          )!,
          successTakeaway: challenge.successTakeaway,
        }}
        initialCss={challenge.starterCss}
        isSignedIn
        nextChallengeSlug="class-selector"
      />,
    );

    const editor = screen.getByLabelText("CSS solution");
    fireEvent.change(editor, { target: { value: firstCss } });
    await vi.advanceTimersByTimeAsync(700);
    fireEvent.change(editor, { target: { value: latestCss } });
    await vi.advanceTimersByTimeAsync(700);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveFirst(new Response(JSON.stringify({ savedAt: "first" })));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/practice/css/class-selector",
      expect.objectContaining({
        body: JSON.stringify({ mode: "draft", css: latestCss }),
      }),
    );
    expect(screen.getByText("Saving…")).toBeInTheDocument();

    await act(async () => {
      resolveLatest(new Response(JSON.stringify({ savedAt: "latest" })));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(
      screen.getByText("Draft saved. Submit to refresh the checks."),
    ).toBeInTheDocument();
    expect(editor).toHaveValue(latestCss);
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("keeps newer CSS visibly unchecked when an older attempt finishes", async () => {
    const submittedCss = `.learning-card {
      background: #ffffff;
      color: #17231e;
    }`;
    const newerCss = `${submittedCss}\n.learning-card { padding: 16px; }`;
    const checks = gradeCssPracticeChallenge(challenge.slug, submittedCss)!;
    let resolveAttempt!: (value: Response) => void;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveAttempt = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        challenge={{
          slug: challenge.slug,
          title: challenge.title,
          checks,
          successTakeaway: challenge.successTakeaway,
        }}
        initialCss={submittedCss}
        isSignedIn
        nextChallengeSlug="class-selector"
      />,
    );

    const editor = screen.getByLabelText("CSS solution");
    fireEvent.click(
      screen.getByRole("button", { name: "Check and save attempt" }),
    );
    fireEvent.change(editor, { target: { value: newerCss } });

    resolveAttempt(
      new Response(
        JSON.stringify({
          id: "attempt-delayed",
          verdict: "Completed",
          bestVerdict: "Completed",
          checks,
          passedChecks: 3,
          totalChecks: 3,
          completedCount: 1,
          totalCount: 6,
          nextChallengeSlug: "descendant-selector",
          createdAt: "2026-08-06T21:00:00.000Z",
          isFirstCompletedResult: true,
        }),
      ),
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          "Your attempt is saved. Newer CSS changes are still unsaved and unchecked.",
        ),
      ).toBeInTheDocument(),
    );
    expect(editor).toHaveValue(newerCss);
    expect(screen.getByText("Unsaved")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/practice/css/class-selector",
      expect.objectContaining({
        body: JSON.stringify({ mode: "submit", css: submittedCss }),
      }),
    );
  });

  it("returns a completed review attempt to the refreshed private session", async () => {
    const completedCss = `.learning-card {
      background: #ffffff;
      color: #17231e;
    }`;
    const checks = gradeCssPracticeChallenge(challenge.slug, completedCss)!;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "attempt-review-pass",
          verdict: "Completed",
          bestVerdict: "Completed",
          checks,
          passedChecks: 3,
          totalChecks: 3,
          completedCount: 1,
          totalCount: 6,
          nextChallengeSlug: "descendant-selector",
          createdAt: "2026-08-05T00:00:00.000Z",
          isFirstCompletedResult: true,
        }),
      }),
    );

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict="Needs revision"
        challenge={{
          slug: challenge.slug,
          title: challenge.title,
          checks,
          successTakeaway: challenge.successTakeaway,
        }}
        initialCss={completedCss}
        isReviewSession
        isSignedIn
        nextChallengeSlug="class-selector"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Check and save attempt" }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: "Return to refreshed review" }),
      ).toHaveAttribute("href", "/practice/css/review"),
    );
    expect(
      screen.getByRole("link", {
        name: /continue to the next unfinished challenge/i,
      }),
    ).toHaveAttribute("href", "/practice/css/descendant-selector");
  });

  it("reveals concept-level recovery only after a saved failed attempt", async () => {
    const failedCss = `.learning-card { color: #17231e; }`;
    const checks = gradeCssPracticeChallenge(challenge.slug, failedCss)!;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "attempt-needs-revision",
        verdict: "Needs revision",
        bestVerdict: "Needs revision",
        checks,
        passedChecks: 2,
        totalChecks: 3,
        completedCount: 0,
        totalCount: 6,
        nextChallengeSlug: "class-selector",
        createdAt: "2026-08-03T12:00:00.000Z",
        isFirstCompletedResult: false,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        challenge={{
          slug: challenge.slug,
          title: challenge.title,
          checks,
          successTakeaway: challenge.successTakeaway,
        }}
        initialCss={failedCss}
        isSignedIn
        nextChallengeSlug="class-selector"
      />,
    );

    const failedCheck = checks.find((check) => !check.passed)!;
    expect(screen.queryByText(failedCheck.concept)).not.toBeInTheDocument();
    expect(screen.queryByText(failedCheck.nextAttempt)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Check and save attempt" }),
    );

    await waitFor(() =>
      expect(screen.getByText(failedCheck.concept)).toBeInTheDocument(),
    );
    expect(screen.getByText(failedCheck.nextAttempt)).toBeInTheDocument();
    expect(screen.getByText("Concept to revisit")).toBeInTheDocument();
    expect(screen.getByText("Next attempt")).toBeInTheDocument();
    expect(screen.queryByText(/background\s*:/i)).not.toBeInTheDocument();
  });

  it("captures only the first genuine completion of all six CSS challenges", async () => {
    const completedCss = `.learning-card {
      background: #ffffff;
      color: #17231e;
    }`;
    const checks = gradeCssPracticeChallenge(challenge.slug, completedCss)!;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "attempt-six",
        verdict: "Completed",
        bestVerdict: "Completed",
        checks,
        passedChecks: 3,
        totalChecks: 3,
        completedCount: 6,
        totalCount: 6,
        nextChallengeSlug: null,
        createdAt: "2026-08-02T00:00:00.000Z",
        isFirstCompletedResult: true,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        challenge={{
          slug: challenge.slug,
          title: challenge.title,
          checks,
          successTakeaway: challenge.successTakeaway,
        }}
        initialCss={completedCss}
        isSignedIn
        nextChallengeSlug={null}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Check and save attempt" }),
    );

    await waitFor(() =>
      expect(captureCssPracticeCompleted).toHaveBeenCalledOnce(),
    );
    expect(captureCssPracticeCompleted).toHaveBeenCalledWith({
      pathSlug: "css-selectors-box-model",
      completionState: "completed",
    });
    expect(JSON.stringify(captureCssPracticeCompleted.mock.calls)).not.toMatch(
      /private learner CSS|private learner answers|private attempt history|private feedback text|learner@example\.com|private-account-id/i,
    );
    expect(
      screen.getByRole("heading", { name: "Did this path make CSS clearer?" }),
    ).toBeInTheDocument();
  });

  it("restores the one saved CSS path response after sign-in", () => {
    const completedCss = `.learning-card {
      background: #ffffff;
      color: #17231e;
    }`;
    const checks = gradeCssPracticeChallenge(challenge.slug, completedCss)!;

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict="Completed"
        challenge={{
          slug: challenge.slug,
          title: challenge.title,
          checks,
          successTakeaway: challenge.successTakeaway,
        }}
        initialCss={completedCss}
        initialPathFeedback={{
          pathSlug: "css-selectors-box-model",
          usefulness: "somewhat",
          comment: "The selector checks helped.",
          updatedAt: "2026-08-03T12:00:00.000Z",
        }}
        isSignedIn
        isPathFeedbackEligible
        nextChallengeSlug={null}
      />,
    );

    expect(screen.getByRole("radio", { name: "Somewhat" })).toBeChecked();
    expect(
      screen.getByPlaceholderText(
        "One detail about the challenges, checks, or explanations",
      ),
    ).toHaveValue("The selector checks helped.");
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: challenge.successTakeaway.concept,
      }),
    ).toBeInTheDocument();
  });

  it("does not recapture a CSS path completion on a repeat completed visit", async () => {
    const completedCss = `.learning-card {
      background: #ffffff;
      color: #17231e;
    }`;
    const checks = gradeCssPracticeChallenge(challenge.slug, completedCss)!;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "attempt-repeat",
          verdict: "Completed",
          bestVerdict: "Completed",
          checks,
          passedChecks: 3,
          totalChecks: 3,
          completedCount: 6,
          totalCount: 6,
          nextChallengeSlug: null,
          createdAt: "2026-08-02T00:05:00.000Z",
          isFirstCompletedResult: false,
        }),
      }),
    );

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict="Completed"
        challenge={{
          slug: challenge.slug,
          title: challenge.title,
          checks,
          successTakeaway: challenge.successTakeaway,
        }}
        initialCss={completedCss}
        isSignedIn
        nextChallengeSlug={null}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Check and save attempt" }),
    );

    await waitFor(() =>
      expect(screen.getByText(/CSS and result are saved/i)).toBeInTheDocument(),
    );
    expect(captureCssPracticeCompleted).not.toHaveBeenCalled();
  });
});

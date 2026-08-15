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
import {
  getCssChallengeAnonymousDraftRecoveryKey,
  getCssChallengeDraftRecoveryKey,
  parseCssChallengeDraftRecovery,
  serializeCssChallengeDraftRecovery,
} from "@/lib/css-challenge-draft-recovery";
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
  window.localStorage.clear();
  vi.useRealTimers();
  captureCssPracticeCompleted.mockReset();
  captureCssPathFeedbackSubmitted.mockReset();
  vi.restoreAllMocks();
});

const challenge = getCssPracticeChallenge("class-selector")!;

describe("CssChallengeWorkspace", () => {
  it("restores the authored CSS after confirmation without changing saved attempts", async () => {
    vi.useFakeTimers();
    const revisedCss = ".learning-card { color: tomato; }";
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CssChallengeWorkspace
        attempts={[
          {
            id: "attempt-kept",
            verdict: "Needs revision",
            passedChecks: 1,
            totalChecks: 3,
            createdAt: "2026-08-15T00:00:00.000Z",
          },
        ]}
        bestVerdict="Needs revision"
        challenge={{
          slug: challenge.slug,
          title: challenge.title,
          checks: gradeCssPracticeChallenge(challenge.slug, revisedCss)!,
          starterCss: challenge.starterCss,
          successTakeaway: challenge.successTakeaway,
        }}
        initialCss={revisedCss}
        isSignedIn
        nextChallengeSlug="class-selector"
      />,
    );

    const editor = screen.getByLabelText("CSS solution");
    fireEvent.click(
      screen.getByRole("button", { name: "Restore starter CSS" }),
    );
    expect(
      screen.getByRole("group", { name: "Restore the authored starter?" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Keep my CSS" }));
    expect(editor).toHaveValue(revisedCss);

    fireEvent.click(
      screen.getByRole("button", { name: "Restore starter CSS" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Restore starter" }));

    expect(editor).toHaveValue(challenge.starterCss);
    expect(screen.getAllByText("Needs revision")).toHaveLength(2);
    expect(screen.getByText("1/3 checks")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Starter CSS restored. Your saved attempts and completion stay unchanged.",
      ),
    ).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(700);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/practice/css/class-selector",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ mode: "draft", css: challenge.starterCss }),
      }),
    );
  });

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

  it("keeps signed-out CSS through account entry and returns to the exact challenge", async () => {
    const anonymousRecoveryKey =
      getCssChallengeAnonymousDraftRecoveryKey(challenge.slug);
    const browserCss = ".learning-card { color: #287652; }";
    const { unmount } = render(
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

    fireEvent.change(screen.getByLabelText("CSS solution"), {
      target: { value: browserCss },
    });

    expect(
      parseCssChallengeDraftRecovery(
        window.localStorage.getItem(anonymousRecoveryKey),
      ),
    ).toMatchObject({ css: browserCss });
    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute(
      "href",
      "/account?next=%2Fpractice%2Fcss%2Fclass-selector",
    );
    unmount();

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        browserRecoveryScope="account-scope-a"
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

    expect(
      await screen.findByRole("heading", {
        name: "Unfinished CSS is available on this browser.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("CSS solution")).toHaveValue(
      challenge.starterCss,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Restore browser CSS" }),
    );

    expect(screen.getByLabelText("CSS solution")).toHaveValue(browserCss);
    expect(window.localStorage.getItem(anonymousRecoveryKey)).toBeNull();
    expect(
      parseCssChallengeDraftRecovery(
        window.localStorage.getItem(
          getCssChallengeDraftRecoveryKey(
            "account-scope-a",
            challenge.slug,
          ),
        ),
      ),
    ).toMatchObject({ css: browserCss });
    expect(screen.getByText("Unsaved")).toBeInTheDocument();
  });

  it("recovers a signed-out CSS draft after a reload without replacing the starter", async () => {
    const anonymousRecoveryKey =
      getCssChallengeAnonymousDraftRecoveryKey(challenge.slug);
    const browserCss = ".learning-card { padding: 24px; }";
    window.localStorage.setItem(
      anonymousRecoveryKey,
      serializeCssChallengeDraftRecovery(browserCss),
    );

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

    expect(
      await screen.findByRole("button", { name: "Restore browser CSS" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("CSS solution")).toHaveValue(
      challenge.starterCss,
    );
    expect(
      screen.getByRole("button", { name: "Keep starter CSS" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Restore browser CSS" }),
    );

    expect(screen.getByLabelText("CSS solution")).toHaveValue(browserCss);
    expect(
      screen.getByText(/browser CSS restored locally/i),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(anonymousRecoveryKey)).not.toBeNull();
  });

  it("keeps private CSS authoritative until anonymous work is explicitly restored", async () => {
    const anonymousRecoveryKey =
      getCssChallengeAnonymousDraftRecoveryKey(challenge.slug);
    const browserCss = ".learning-card { color: #287652; }";
    const privateCss = ".learning-card { color: #17231e; }";
    window.localStorage.setItem(
      anonymousRecoveryKey,
      serializeCssChallengeDraftRecovery(browserCss),
    );

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        browserRecoveryScope="account-scope-a"
        challenge={{
          slug: challenge.slug,
          title: challenge.title,
          checks: gradeCssPracticeChallenge(challenge.slug, privateCss)!,
          successTakeaway: challenge.successTakeaway,
        }}
        initialCss={privateCss}
        isSignedIn
        nextChallengeSlug="class-selector"
      />,
    );

    expect(
      await screen.findByRole("button", { name: "Restore browser CSS" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("CSS solution")).toHaveValue(privateCss);

    fireEvent.click(screen.getByRole("button", { name: "Keep saved CSS" }));

    expect(screen.getByLabelText("CSS solution")).toHaveValue(privateCss);
    expect(window.localStorage.getItem(anonymousRecoveryKey)).toBeNull();
  });

  it("keeps the private draft loaded until browser CSS is explicitly restored", async () => {
    const browserRecoveryScope = "account-scope-a";
    const browserCss = ".learning-card { color: #287652; }";
    const recoveryKey = getCssChallengeDraftRecoveryKey(
      browserRecoveryScope,
      challenge.slug,
    );
    window.localStorage.setItem(
      recoveryKey,
      serializeCssChallengeDraftRecovery(browserCss),
    );

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        browserRecoveryScope={browserRecoveryScope}
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

    expect(
      await screen.findByRole("heading", {
        name: "Unfinished CSS is available on this browser.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("CSS solution")).toHaveValue(
      challenge.starterCss,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Restore browser CSS" }),
    );

    expect(screen.getByLabelText("CSS solution")).toHaveValue(browserCss);
    expect(screen.getByText("Unsaved")).toBeInTheDocument();
    expect(
      screen.getByText(/browser CSS restored as unsaved work/i),
    ).toBeInTheDocument();
    expect(parseCssChallengeDraftRecovery(localStorage.getItem(recoveryKey)))
      .toMatchObject({ css: browserCss });
  });

  it("keeps account and challenge recovery copies isolated", async () => {
    const recoveryKey = getCssChallengeDraftRecoveryKey(
      "other-account-scope",
      challenge.slug,
    );
    window.localStorage.setItem(
      recoveryKey,
      serializeCssChallengeDraftRecovery(".learning-card { color: red; }"),
    );

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        browserRecoveryScope="current-account-scope"
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

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Restore browser CSS" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText("CSS solution")).toHaveValue(
      challenge.starterCss,
    );
  });

  it("clears a browser copy that already matches the private draft", async () => {
    const browserRecoveryScope = "account-scope-a";
    const recoveryKey = getCssChallengeDraftRecoveryKey(
      browserRecoveryScope,
      challenge.slug,
    );
    window.localStorage.setItem(
      recoveryKey,
      serializeCssChallengeDraftRecovery(challenge.starterCss),
    );

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        browserRecoveryScope={browserRecoveryScope}
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

    await waitFor(() =>
      expect(window.localStorage.getItem(recoveryKey)).toBeNull(),
    );
    expect(
      screen.queryByRole("button", { name: "Restore browser CSS" }),
    ).not.toBeInTheDocument();
  });

  it("discards browser CSS only when the learner keeps the private draft", async () => {
    const browserRecoveryScope = "account-scope-a";
    const recoveryKey = getCssChallengeDraftRecoveryKey(
      browserRecoveryScope,
      challenge.slug,
    );
    window.localStorage.setItem(
      recoveryKey,
      serializeCssChallengeDraftRecovery(".learning-card { color: red; }"),
    );

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        browserRecoveryScope={browserRecoveryScope}
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

    fireEvent.click(
      await screen.findByRole("button", { name: "Keep saved CSS" }),
    );

    expect(window.localStorage.getItem(recoveryKey)).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Restore browser CSS" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("CSS solution")).toHaveValue(
      challenge.starterCss,
    );
  });

  it("clears browser CSS after the exact private draft saves", async () => {
    vi.useFakeTimers();
    const browserRecoveryScope = "account-scope-a";
    const recoveryKey = getCssChallengeDraftRecoveryKey(
      browserRecoveryScope,
      challenge.slug,
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ saved: true }))),
    );

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        browserRecoveryScope={browserRecoveryScope}
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

    fireEvent.change(screen.getByLabelText("CSS solution"), {
      target: { value: ".learning-card { color: #287652; }" },
    });
    expect(window.localStorage.getItem(recoveryKey)).not.toBeNull();

    await vi.advanceTimersByTimeAsync(700);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(window.localStorage.getItem(recoveryKey)).toBeNull();
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("keeps browser CSS available when its private draft save fails", async () => {
    vi.useFakeTimers();
    const browserRecoveryScope = "account-scope-a";
    const recoveryKey = getCssChallengeDraftRecoveryKey(
      browserRecoveryScope,
      challenge.slug,
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
    );

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        browserRecoveryScope={browserRecoveryScope}
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

    fireEvent.change(screen.getByLabelText("CSS solution"), {
      target: { value: ".learning-card { color: #287652; }" },
    });
    await vi.advanceTimersByTimeAsync(700);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(parseCssChallengeDraftRecovery(localStorage.getItem(recoveryKey)))
      .toMatchObject({ css: ".learning-card { color: #287652; }" });
    expect(screen.getByText("Save failed")).toBeInTheDocument();
  });

  it("clears browser CSS after the exact attempt is reviewed and saved", async () => {
    const browserRecoveryScope = "account-scope-a";
    const recoveryKey = getCssChallengeDraftRecoveryKey(
      browserRecoveryScope,
      challenge.slug,
    );
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
          id: "attempt-recovery",
          verdict: "Completed",
          bestVerdict: "Completed",
          checks,
          passedChecks: 3,
          totalChecks: 3,
          completedCount: 1,
          totalCount: 6,
          nextChallengeSlug: "descendant-selector",
          createdAt: "2026-08-14T10:00:00.000Z",
          isFirstCompletedResult: true,
        }),
      }),
    );

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        browserRecoveryScope={browserRecoveryScope}
        challenge={{
          slug: challenge.slug,
          title: challenge.title,
          checks,
          successTakeaway: challenge.successTakeaway,
        }}
        initialCss={challenge.starterCss}
        isSignedIn
        nextChallengeSlug="class-selector"
      />,
    );

    fireEvent.change(screen.getByLabelText("CSS solution"), {
      target: { value: completedCss },
    });
    expect(window.localStorage.getItem(recoveryKey)).not.toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Check and save attempt" }),
    );

    await waitFor(() =>
      expect(screen.getByText(/CSS and result are saved/i)).toBeInTheDocument(),
    );
    expect(window.localStorage.getItem(recoveryKey)).toBeNull();
  });

  it("does not clear newer browser CSS when an older private save finishes", async () => {
    vi.useFakeTimers();
    const browserRecoveryScope = "account-scope-a";
    const recoveryKey = getCssChallengeDraftRecoveryKey(
      browserRecoveryScope,
      challenge.slug,
    );
    const firstCss = ".learning-card { color: #17231e; }";
    const latestCss = ".learning-card { color: #287652; }";
    let resolveFirst!: (value: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        new Promise<Response>((resolve) => {
          resolveFirst = resolve;
        }),
      ),
    );

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        browserRecoveryScope={browserRecoveryScope}
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

    await act(async () => {
      resolveFirst(new Response(JSON.stringify({ saved: true })));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(parseCssChallengeDraftRecovery(localStorage.getItem(recoveryKey)))
      .toMatchObject({ css: latestCss });
    expect(editor).toHaveValue(latestCss);
    expect(screen.getByText("Unsaved")).toBeInTheDocument();
  });

  it("keeps a signed-out attempt local and offers account creation", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        browserRecoveryScope="signed-out-scope"
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

    fireEvent.change(screen.getByLabelText("CSS solution"), {
      target: { value: ".learning-card { color: #287652; }" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Check and save attempt" }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(window.localStorage).toHaveLength(1);
    expect(
      screen.getByText(/create a free account to check and save/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create account" }),
    ).toHaveAttribute(
      "href",
      "/account?next=%2Fpractice%2Fcss%2Fclass-selector",
    );
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

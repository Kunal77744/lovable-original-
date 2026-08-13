import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PrivateJavaScriptLabDraftStatus,
  usePrivateJavaScriptLabDraft,
} from "./private-javascript-lab-draft";
import {
  getJavaScriptLabDraftRecoveryKey,
  serializeJavaScriptLabDraftRecovery,
} from "@/lib/javascript-lab-draft-recovery";

const recoveryKey = getJavaScriptLabDraftRecoveryKey(
  "learner-a",
  "recursion",
  "base-case",
);

function DraftHarness({
  initialDrafts = {},
  browserRecoveryScope = "learner-a",
}: {
  initialDrafts?: Record<string, string>;
  browserRecoveryScope?: string;
}) {
  const draft = usePrivateJavaScriptLabDraft({
    labSlug: "recursion",
    exerciseId: "base-case",
    starterCode: "starter code",
    initialDrafts,
    browserRecoveryScope,
  });

  return (
    <>
      <label htmlFor="draft-source">Exercise source</label>
      <textarea
        id="draft-source"
        value={draft.source}
        onChange={(event) => draft.updateSource(event.target.value)}
      />
      <PrivateJavaScriptLabDraftStatus
        browserRecovery={draft.browserRecovery}
        state={draft.state}
        onRetry={draft.retrySave}
      />
    </>
  );
}

function deferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

describe("private guided JavaScript drafts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("restores the exact account-backed source as saved", () => {
    vi.stubGlobal("fetch", vi.fn());
    render(
      <DraftHarness
        initialDrafts={{ "base-case": "function solve() { return 1; }" }}
      />,
    );

    expect(screen.getByRole<HTMLTextAreaElement>("textbox")).toHaveValue(
      "function solve() { return 1; }",
    );
    expect(
      screen.getByText("Saved privately to your account"),
    ).toBeInTheDocument();
  });

  it("keeps newer code unsaved until its exact revision finishes saving", async () => {
    const first = deferredResponse();
    const second = deferredResponse();
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    vi.stubGlobal("fetch", fetchMock);
    render(<DraftHarness />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "first revision" },
    });
    expect(window.localStorage.getItem(recoveryKey)).toContain(
      "first revision",
    );
    await act(async () => {
      vi.advanceTimersByTime(700);
      await Promise.resolve();
    });

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "newest revision" },
    });
    expect(window.localStorage.getItem(recoveryKey)).toContain(
      "newest revision",
    );
    await act(async () => {
      vi.advanceTimersByTime(700);
      await Promise.resolve();
    });

    await act(async () => {
      first.resolve(new Response(null, { status: 200 }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual({
      exerciseId: "base-case",
      source: "newest revision",
    });
    expect(screen.getByText("Saving privately…")).toBeInTheDocument();
    expect(window.localStorage.getItem(recoveryKey)).toContain(
      "newest revision",
    );

    await act(async () => {
      second.resolve(new Response(null, { status: 200 }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      screen.getByText("Saved privately to your account"),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(recoveryKey)).toBeNull();
  });

  it("offers a newer browser copy without replacing private saved source", async () => {
    vi.stubGlobal("fetch", vi.fn());
    window.localStorage.setItem(
      recoveryKey,
      serializeJavaScriptLabDraftRecovery("newer browser revision"),
    );

    render(
      <DraftHarness
        initialDrafts={{ "base-case": "private saved revision" }}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByRole("textbox")).toHaveValue("private saved revision");
    expect(
      screen.getByText("Newer exercise code is available."),
    ).toBeInTheDocument();
  });

  it("restores a browser copy as unsaved work and clears it after exact saving", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 200 })),
    );
    window.localStorage.setItem(
      recoveryKey,
      serializeJavaScriptLabDraftRecovery("newer browser revision"),
    );
    render(
      <DraftHarness
        initialDrafts={{ "base-case": "private saved revision" }}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Restore browser draft" }),
    );
    expect(screen.getByRole("textbox")).toHaveValue("newer browser revision");
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(700);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      screen.getByText("Saved privately to your account"),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(recoveryKey)).toBeNull();
  });

  it("keeps the private saved source when the learner dismisses recovery", async () => {
    vi.stubGlobal("fetch", vi.fn());
    window.localStorage.setItem(
      recoveryKey,
      serializeJavaScriptLabDraftRecovery("newer browser revision"),
    );
    render(
      <DraftHarness
        initialDrafts={{ "base-case": "private saved revision" }}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Keep saved exercise" }),
    );

    expect(screen.getByRole("textbox")).toHaveValue("private saved revision");
    expect(
      screen.queryByText("Newer exercise code is available."),
    ).not.toBeInTheDocument();
    expect(window.localStorage.getItem(recoveryKey)).toBeNull();
  });

  it("does not expose one account scope's browser copy to another", async () => {
    vi.stubGlobal("fetch", vi.fn());
    window.localStorage.setItem(
      recoveryKey,
      serializeJavaScriptLabDraftRecovery("learner a browser revision"),
    );

    render(
      <DraftHarness
        browserRecoveryScope="learner-b"
        initialDrafts={{ "base-case": "learner b private revision" }}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByRole("textbox")).toHaveValue(
      "learner b private revision",
    );
    expect(
      screen.queryByText("Newer exercise code is available."),
    ).not.toBeInTheDocument();
  });

  it("does not re-offer source already loaded during this session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 200 })),
    );
    render(
      <DraftHarness
        initialDrafts={{ "base-case": "private saved revision" }}
      />,
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "browser revision already loaded" },
    });
    expect(window.localStorage.getItem(recoveryKey)).toContain(
      "browser revision already loaded",
    );

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(
      screen.queryByText("Newer exercise code is available."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue(
      "browser revision already loaded",
    );
  });
});

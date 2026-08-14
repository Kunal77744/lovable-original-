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
  savedJavaScriptLabSourceFileContents,
  usePrivateJavaScriptLabDraft,
} from "./private-javascript-lab-draft";

function DraftHarness({
  initialDrafts = {},
}: {
  initialDrafts?: Record<string, string>;
}) {
  const draft = usePrivateJavaScriptLabDraft({
    labSlug: "recursion",
    exerciseId: "base-case",
    starterCode: "starter code",
    initialDrafts,
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
        state={draft.state}
        onRetry={draft.retrySave}
        savedSource={draft.savedSource}
        fileName="base-case.js"
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
  });

  afterEach(() => {
    cleanup();
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
    expect(
      screen.getByRole("button", { name: "Download saved .js" }),
    ).toBeInTheDocument();
  });

  it("downloads the exact saved bytes with the authored exercise filename", () => {
    const source = "function solve() {\n  return 'exact';\n}";
    let downloadedFile = "";
    const createObjectURL = vi.fn().mockReturnValue("blob:guided-draft");
    const revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      function () {
        downloadedFile = this.download;
      },
    );
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    vi.stubGlobal("fetch", vi.fn());

    render(<DraftHarness initialDrafts={{ "base-case": source }} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Download saved .js" }),
    );

    expect(savedJavaScriptLabSourceFileContents(source)).toBe(source);
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(createObjectURL.mock.calls[0]?.[0]).toBeInstanceOf(Blob);
    expect(downloadedFile).toBe("base-case.js");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:guided-draft");
    expect(screen.getByText("base-case.js downloaded.")).toBeInTheDocument();
  });

  it("keeps downloads absent before a private save and hides them after an edit", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 200 })),
    );
    render(<DraftHarness />);

    expect(
      screen.queryByRole("button", { name: "Download saved .js" }),
    ).not.toBeInTheDocument();

    cleanup();
    render(
      <DraftHarness
        initialDrafts={{ "base-case": "function solve() { return 1; }" }}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Download saved .js" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "newer browser-only revision" },
    });
    expect(
      screen.queryByRole("button", { name: "Download saved .js" }),
    ).not.toBeInTheDocument();
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
    await act(async () => {
      vi.advanceTimersByTime(700);
      await Promise.resolve();
    });

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "newest revision" },
    });
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
    expect(
      screen.queryByRole("button", { name: "Download saved .js" }),
    ).not.toBeInTheDocument();

    await act(async () => {
      second.resolve(new Response(null, { status: 200 }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      screen.getByText("Saved privately to your account"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download saved .js" }),
    ).toBeInTheDocument();
  });
});

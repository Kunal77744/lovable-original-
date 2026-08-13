import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getEmptyHtmlCssCapstoneChecks,
  HTML_CSS_CAPSTONE_STARTER_CSS,
  HTML_CSS_CAPSTONE_STARTER_HTML,
  type HtmlCssCapstoneRecord,
} from "@/lib/html-css-capstone";
import {
  getProjectDraftRecoveryKey,
  parseProjectDraftRecovery,
  serializeProjectDraftRecovery,
} from "@/lib/project-draft-recovery";
import { HtmlCssCapstoneWorkspace } from "./html-css-capstone-workspace";

vi.mock("@/lib/product-analytics", () => ({ captureProjectCompleted: vi.fn() }));

const starter: HtmlCssCapstoneRecord = {
  html: HTML_CSS_CAPSTONE_STARTER_HTML,
  css: HTML_CSS_CAPSTONE_STARTER_CSS,
  saved: false,
  updatedAt: null,
  hasUnreviewedChanges: false,
  submission: null,
};

describe("HtmlCssCapstoneWorkspace", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    window.localStorage.clear();
  });

  it("uses language-aware keyboard editing in both project files", () => {
    render(
      <HtmlCssCapstoneWorkspace
        projectSlug="html-css-resource-library"
        initialProject={{
          ...starter,
          html: "<main>Library</main>",
          css: ".library { display: grid; }",
        }}
      />,
    );

    const htmlEditor = screen.getByLabelText(
      "Semantic HTML",
    ) as HTMLTextAreaElement;
    const cssEditor = screen.getByLabelText(
      "Component CSS",
    ) as HTMLTextAreaElement;
    htmlEditor.setSelectionRange(0, htmlEditor.value.length);
    fireEvent.keyDown(htmlEditor, { key: "/", ctrlKey: true });
    cssEditor.setSelectionRange(0, cssEditor.value.length);
    fireEvent.keyDown(cssEditor, { key: "/", ctrlKey: true });

    expect(htmlEditor).toHaveValue("<!--<main>Library</main>-->");
    expect(cssEditor).toHaveValue("/*.library { display: grid; }*/");
    expect(htmlEditor).toHaveAttribute(
      "aria-describedby",
      "html-css-capstone-html-keyboard-hint",
    );
    expect(cssEditor).toHaveAttribute(
      "aria-describedby",
      "html-css-capstone-css-keyboard-hint",
    );
    expect(screen.getAllByText("Unsaved")).toHaveLength(2);
  });

  it("restores exact files and keeps a newer CSS copy when an older save returns", async () => {
    const recoveredHtml = `${HTML_CSS_CAPSTONE_STARTER_HTML}\n<!-- recovered -->`;
    const recoveredCss = `${HTML_CSS_CAPSTONE_STARTER_CSS}\n/* recovered */`;
    const newerCss = `${recoveredCss}\n/* newer */`;
    const htmlRecoveryKey = getProjectDraftRecoveryKey(
      "learner-a",
      "html-css-resource-library",
      "index.html",
    );
    const cssRecoveryKey = getProjectDraftRecoveryKey(
      "learner-a",
      "html-css-resource-library",
      "styles.css",
    );
    window.localStorage.setItem(
      htmlRecoveryKey,
      serializeProjectDraftRecovery(recoveredHtml),
    );
    window.localStorage.setItem(
      cssRecoveryKey,
      serializeProjectDraftRecovery(recoveredCss),
    );
    let resolveSave: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveSave = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <HtmlCssCapstoneWorkspace
        browserRecoveryScope="learner-a"
        projectSlug="html-css-resource-library"
        initialProject={{ ...starter, saved: true }}
      />,
    );

    const htmlEditor = screen.getByLabelText("Semantic HTML");
    const cssEditor = screen.getByLabelText("Component CSS");
    expect(htmlEditor).toHaveValue(HTML_CSS_CAPSTONE_STARTER_HTML);
    expect(cssEditor).toHaveValue(HTML_CSS_CAPSTONE_STARTER_CSS);
    fireEvent.click(
      await screen.findByRole("button", { name: "Restore browser files" }),
    );
    expect(htmlEditor).toHaveValue(recoveredHtml);
    expect(cssEditor).toHaveValue(recoveredCss);

    fireEvent.click(screen.getByRole("button", { name: "Save now" }));
    fireEvent.change(cssEditor, { target: { value: newerCss } });
    resolveSave?.({
      ok: true,
      json: async () => ({
        ...starter,
        html: recoveredHtml,
        css: recoveredCss,
        saved: true,
      }),
    } as Response);

    await waitFor(() => {
      expect(window.localStorage.getItem(htmlRecoveryKey)).toBeNull();
      expect(
        parseProjectDraftRecovery(
          window.localStorage.getItem(cssRecoveryKey),
          20_000,
        ),
      ).toEqual(expect.objectContaining({ source: newerCss }));
    });
    expect(cssEditor).toHaveValue(newerCss);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/projects/html-css-resource-library",
      expect.objectContaining({
        body: JSON.stringify({
          action: "save",
          html: recoveredHtml,
          css: recoveredCss,
        }),
      }),
    );
  });

  it("offers both saved project files only while both editors match them", () => {
    render(
      <HtmlCssCapstoneWorkspace
        projectSlug="html-css-resource-library"
        initialProject={{ ...starter, saved: true }}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Download index.html" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download styles.css" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Component CSS"), {
      target: { value: `${HTML_CSS_CAPSTONE_STARTER_CSS}\n/* newer work */` },
    });
    expect(
      screen.queryByRole("button", { name: "Download index.html" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Download styles.css" }),
    ).not.toBeInTheDocument();
  });

  it("keeps newer edits visibly unsaved when an older two-file save finishes", async () => {
    let resolveSave: ((value: Response) => void) | undefined;
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise<Response>((resolve) => { resolveSave = resolve; })));
    render(<HtmlCssCapstoneWorkspace projectSlug="html-css-resource-library" initialProject={starter} />);
    const editor = screen.getByLabelText("Component CSS");
    fireEvent.change(editor, { target: { value: ".first {}" } });
    fireEvent.click(screen.getByRole("button", { name: "Save now" }));
    fireEvent.change(editor, { target: { value: ".newer {}" } });
    resolveSave?.({
      ok: true,
      json: async () => ({ ...starter, css: ".first {}", saved: true }),
    } as Response);
    await waitFor(() => expect(screen.getByText("Your saved draft is safe. Newer edits are still unsaved.")).toBeInTheDocument());
    expect(editor).toHaveValue(".newer {}");
    expect(screen.getByRole("button", { name: "Save now" })).toBeEnabled();
  });

  it("saves both private files together after typing pauses", async () => {
    vi.useFakeTimers();
    const editedHtml = `${HTML_CSS_CAPSTONE_STARTER_HTML}\n<!-- autosaved -->`;
    const editedCss = `${HTML_CSS_CAPSTONE_STARTER_CSS}\n/* autosaved */`;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...starter,
        html: editedHtml,
        css: editedCss,
        saved: true,
        updatedAt: "2026-08-09T18:00:00.000Z",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<HtmlCssCapstoneWorkspace projectSlug="html-css-resource-library" initialProject={starter} />);
    fireEvent.change(screen.getByLabelText("Semantic HTML"), {
      target: { value: editedHtml },
    });
    fireEvent.change(screen.getByLabelText("Component CSS"), {
      target: { value: editedCss },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/projects/html-css-resource-library",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          action: "save",
          html: editedHtml,
          css: editedCss,
        }),
      }),
    );
    expect(
      screen.getByText("Saved both files privately to your account."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Saved")).toHaveLength(2);
  });

  it("keeps both files retryable after an autosave failure", async () => {
    vi.useFakeTimers();
    const editedHtml = `${HTML_CSS_CAPSTONE_STARTER_HTML}\n<!-- keep this -->`;
    const editedCss = `${HTML_CSS_CAPSTONE_STARTER_CSS}\n/* keep this */`;
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    render(<HtmlCssCapstoneWorkspace projectSlug="html-css-resource-library" initialProject={starter} />);
    const htmlEditor = screen.getByLabelText("Semantic HTML");
    const cssEditor = screen.getByLabelText("Component CSS");
    fireEvent.change(htmlEditor, { target: { value: editedHtml } });
    fireEvent.change(cssEditor, { target: { value: editedCss } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    expect(htmlEditor).toHaveValue(editedHtml);
    expect(cssEditor).toHaveValue(editedCss);
    expect(
      screen.getByText(
        "The project could not be saved. Check your connection and try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Unsaved")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Save now" })).toBeEnabled();
  });

  it("queues both exact newer files while an autosave is in flight", async () => {
    vi.useFakeTimers();
    let resolveFirstSave: ((value: Response) => void) | undefined;
    const firstHtml = `${HTML_CSS_CAPSTONE_STARTER_HTML}\n<!-- first -->`;
    const firstCss = `${HTML_CSS_CAPSTONE_STARTER_CSS}\n/* first */`;
    const newerHtml = `${firstHtml}\n<!-- newer -->`;
    const newerCss = `${firstCss}\n/* newer */`;
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
          ...starter,
          html: newerHtml,
          css: newerCss,
          saved: true,
          updatedAt: "2026-08-09T18:01:00.000Z",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<HtmlCssCapstoneWorkspace projectSlug="html-css-resource-library" initialProject={starter} />);
    const htmlEditor = screen.getByLabelText("Semantic HTML");
    const cssEditor = screen.getByLabelText("Component CSS");
    fireEvent.change(htmlEditor, { target: { value: firstHtml } });
    fireEvent.change(cssEditor, { target: { value: firstCss } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    fireEvent.change(htmlEditor, { target: { value: newerHtml } });
    fireEvent.change(cssEditor, { target: { value: newerCss } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    await act(async () => {
      resolveFirstSave?.({
        ok: true,
        json: async () => ({
          ...starter,
          html: firstHtml,
          css: firstCss,
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
        body: JSON.stringify({
          action: "save",
          html: newerHtml,
          css: newerCss,
        }),
      }),
    );
    expect(htmlEditor).toHaveValue(newerHtml);
    expect(cssEditor).toHaveValue(newerCss);
    expect(
      screen.getByText("Saved both files privately to your account."),
    ).toBeInTheDocument();
  });

  it("opens the private debrief after a current saved 6 of 6 review", () => {
    render(
      <HtmlCssCapstoneWorkspace
        projectSlug="html-css-resource-library"
        initialProject={{
          ...starter,
          saved: true,
          submission: {
            status: "completed",
            checks: getEmptyHtmlCssCapstoneChecks().map((check) => ({
              ...check,
              passed: true,
            })),
            passedChecks: 6,
            totalChecks: 6,
            submittedAt: "2026-08-07T03:00:00.000Z",
          },
        }}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Open project debrief" }),
    ).toHaveAttribute("href", "/projects/html-css-resource-library/debrief");
    expect(
      screen.getByRole("link", { name: "Return to private progress" }),
    ).toHaveAttribute("href", "/profile");
  });
});

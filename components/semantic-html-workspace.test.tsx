import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SEMANTIC_HTML_STARTER } from "@/lib/semantic-html-workspace";
import { SemanticHtmlWorkspace } from "./semantic-html-workspace";

const initialChecks = [
  {
    id: "page-header" as const,
    label: "Introduce the page with a header",
    guidance: "Add a header before main.",
    passed: true,
  },
  {
    id: "main-article" as const,
    label: "Put the article inside one main landmark",
    guidance: "Add an article inside main.",
    passed: false,
  },
  {
    id: "article-heading" as const,
    label: "Give the article one clear page heading",
    guidance: "Add an h1.",
    passed: false,
  },
  {
    id: "article-section" as const,
    label: "Group one idea in a labelled section",
    guidance: "Add a section and h2.",
    passed: false,
  },
  {
    id: "page-footer" as const,
    label: "Close the page with a footer",
    guidance: "Add a footer after main.",
    passed: true,
  },
];

describe("SemanticHtmlWorkspace", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("updates an empty-sandbox preview without exposing network-bearing markup", async () => {
    render(
      <SemanticHtmlWorkspace
        lessonSlug="semantic-html"
        initialHtml='<main><img src="https://example.com/track.png" /><script>alert(1)</script></main>'
        initialChecks={initialChecks}
        initiallySaved={false}
      />,
    );

    const preview = await screen.findByTitle("Semantic HTML live preview");

    expect(preview).toHaveAttribute("sandbox", "");
    expect(preview).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(preview.getAttribute("srcdoc")).toContain("default-src 'none'");
    expect(preview.getAttribute("srcdoc")).not.toContain("https://example.com");
    expect(preview.getAttribute("srcdoc")).not.toContain("<script");

    fireEvent.change(screen.getByLabelText("Semantic HTML"), {
      target: { value: "<main><article>Updated preview</article></main>" },
    });

    await waitFor(() =>
      expect(preview.getAttribute("srcdoc")).toContain("Updated preview"),
    );
  });

  it("saves the exact draft and replaces checks with the server result", async () => {
    const savedChecks = initialChecks.map((check) => ({
      ...check,
      passed: true,
    }));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        html: "<main><article>My draft</article></main>",
        checks: savedChecks,
        saved: true,
        updatedAt: "2026-07-26T00:00:00.000Z",
        submission: {
          status: "completed",
          passedChecks: 5,
          totalChecks: 5,
          submittedAt: "2026-07-26T00:00:00.000Z",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <SemanticHtmlWorkspace
        lessonSlug="semantic-html"
        initialHtml="<main></main>"
        initialChecks={initialChecks}
        initiallySaved={false}
      />,
    );

    fireEvent.change(screen.getByLabelText("Semantic HTML"), {
      target: { value: "<main><article>My draft</article></main>" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit assignment" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Assignment complete. Your HTML and 5/5 result are saved.",
        ),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lessons/semantic-html/workspace",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          html: "<main><article>My draft</article></main>",
        }),
      }),
    );
    expect(screen.getByLabelText("5 of 5 checks pass")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Resubmit assignment" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Assignment complete")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download saved .html" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("First check to repair")).not.toBeInTheDocument();
    expect(window.localStorage).toHaveLength(0);
  });

  it("shows the first failed repair after an unsuccessful submission saves", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        html: "<main><article>Keep revising</article></main>",
        checks: initialChecks,
        saved: true,
        updatedAt: "2026-08-17T00:00:00.000Z",
        submission: {
          status: "in_progress",
          passedChecks: 2,
          totalChecks: 5,
          submittedAt: "2026-08-17T00:00:00.000Z",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <SemanticHtmlWorkspace
        lessonSlug="semantic-html"
        initialHtml="<main></main>"
        initialChecks={initialChecks}
        initiallySaved={false}
      />,
    );

    expect(screen.queryByText("First check to repair")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Semantic HTML"), {
      target: { value: "<main><article>Keep revising</article></main>" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit assignment" }));

    expect(
      await screen.findByRole("heading", {
        name: "Put the article inside one main landmark",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("2/5")).toBeInTheDocument();
    expect(
      screen.getByText(/Submission saved. 2 of 5 rubric checks pass/),
    ).toBeInTheDocument();
  });

  it("reviews edits against the exact last submitted HTML", () => {
    const savedHtml = "<main><article>Saved version</article></main>";
    const revisedHtml = "<main><article>Revised version</article></main>";

    render(
      <SemanticHtmlWorkspace
        lessonSlug="semantic-html"
        initialHtml={savedHtml}
        initialChecks={initialChecks}
        initiallySaved
      />,
    );

    fireEvent.change(screen.getByLabelText("Semantic HTML"), {
      target: { value: revisedHtml },
    });
    fireEvent.click(screen.getByText("Review code changes"));

    expect(
      screen.getByRole("button", { name: "Last saved check" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("list", { name: "Changes from the last saved check" }),
    ).toHaveTextContent("Revised version");
    expect(
      screen.getByRole("list", { name: "Changes from the last saved check" }),
    ).toHaveTextContent("Saved version");
  });

  it("keeps newer edits visibly unsaved when an older submission finishes", async () => {
    const submittedHtml = "<main><article>Submitted draft</article></main>";
    const newerHtml = "<main><article>Newer unsaved draft</article></main>";
    const savedChecks = initialChecks.map((check) => ({
      ...check,
      passed: true,
    }));
    let resolveResponse!: (value: {
      ok: boolean;
      json: () => Promise<WorkspaceResponseFixture>;
    }) => void;
    type WorkspaceResponseFixture = {
      html: string;
      checks: typeof savedChecks;
      saved: boolean;
      updatedAt: string;
      submission: {
        status: "completed";
        passedChecks: number;
        totalChecks: number;
        submittedAt: string;
      };
    };
    const responsePromise = new Promise<{
      ok: boolean;
      json: () => Promise<WorkspaceResponseFixture>;
    }>((resolve) => {
      resolveResponse = resolve;
    });
    const fetchMock = vi.fn().mockReturnValue(responsePromise);
    vi.stubGlobal("fetch", fetchMock);

    render(
      <SemanticHtmlWorkspace
        lessonSlug="semantic-html"
        initialHtml="<main></main>"
        initialChecks={initialChecks}
        initiallySaved={false}
      />,
    );

    fireEvent.change(screen.getByLabelText("Semantic HTML"), {
      target: { value: submittedHtml },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit assignment" }));
    fireEvent.change(screen.getByLabelText("Semantic HTML"), {
      target: { value: newerHtml },
    });

    resolveResponse({
      ok: true,
      json: async () => ({
        html: submittedHtml,
        checks: savedChecks,
        saved: true,
        updatedAt: "2026-08-06T00:00:00.000Z",
        submission: {
          status: "completed",
          passedChecks: 5,
          totalChecks: 5,
          submittedAt: "2026-08-06T00:00:00.000Z",
        },
      }),
    });

    await waitFor(() =>
      expect(
        screen.getByText(
          "Your submitted result is saved. Newer changes are still unsaved.",
        ),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lessons/semantic-html/workspace",
      expect.objectContaining({
        body: JSON.stringify({ html: submittedHtml }),
      }),
    );
    expect(screen.getByLabelText("Semantic HTML")).toHaveValue(newerHtml);
    expect(screen.getByText("Changes not submitted")).toBeInTheDocument();
    expect(screen.getByText("Previous result")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Resubmit assignment" }),
    ).toBeEnabled();
    expect(
      screen.queryByText(
        "Assignment complete. Your HTML and 5/5 result are saved.",
      ),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Review code changes"));
    expect(
      screen.getByRole("list", { name: "Changes from the last saved check" }),
    ).toHaveTextContent("Newer unsaved draft");
    expect(
      screen.getByRole("list", { name: "Changes from the last saved check" }),
    ).toHaveTextContent("Submitted draft");
    expect(
      screen.queryByRole("button", { name: "Download saved .html" }),
    ).not.toBeInTheDocument();
  });

  it("restores a saved submission and presents its revision state", () => {
    render(
      <SemanticHtmlWorkspace
        lessonSlug="semantic-html"
        initialHtml="<main></main>"
        initialChecks={initialChecks}
        initiallySaved
      />,
    );

    expect(screen.getByText("Saved result")).toBeInTheDocument();
    expect(screen.getByText("Needs revision")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Resubmit assignment" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Saved submission restored. Revise the open rubric checks and resubmit.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download saved .html" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Put the article inside one main landmark",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Main content and article boundaries")).toBeInTheDocument();
    expect(screen.getByText("Inspect first")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Return to index.html/ })).toHaveAttribute(
      "href",
      "#semantic-html-editor",
    );
  });

  it("restores the authored lesson starter without changing the saved result", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <SemanticHtmlWorkspace
        lessonSlug="semantic-html"
        initialHtml="<main><article>Saved learner work</article></main>"
        initialChecks={initialChecks}
        initiallySaved
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Restore lesson starter" }),
    );
    expect(
      screen.getByText("Restore the authored lesson starter?"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByLabelText("Semantic HTML")).toHaveValue(
      "<main><article>Saved learner work</article></main>",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Restore lesson starter" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Restore starter" }));

    expect(screen.getByLabelText("Semantic HTML")).toHaveValue(
      SEMANTIC_HTML_STARTER,
    );
    expect(
      screen.getByText(
        "Lesson starter restored in the editor. Your saved result and checks have not changed.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Changes not submitted")).toBeInTheDocument();
    expect(screen.getByText("Previous result")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Download saved .html" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("First check to repair")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reviews signed-in changes from the authored starter without submitting", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <SemanticHtmlWorkspace
        lessonSlug="semantic-html"
        initialHtml={SEMANTIC_HTML_STARTER}
        initialChecks={initialChecks}
        initiallySaved={false}
      />,
    );

    expect(
      screen.queryByText("Review changes from starter"),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Semantic HTML"), {
      target: { value: `${SEMANTIC_HTML_STARTER}\n<footer>Practice</footer>` },
    });
    fireEvent.click(screen.getByText("Review changes from starter"));

    expect(screen.getByText("1 added")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Changes from the authored starter" }),
    ).toHaveTextContent("<footer>Practice</footer>");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps signed-out code local until the learner tries to submit", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <SemanticHtmlWorkspace
        lessonSlug="semantic-html"
        initialHtml="<main></main>"
        initialChecks={initialChecks}
        initiallySaved={false}
        isSignedIn={false}
      />,
    );

    expect(screen.getByText("Local draft")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Create account" }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Semantic HTML"), {
      target: { value: "<main><article>Local work</article></main>" },
    });
    expect(
      screen.queryByText("Review changes from starter"),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Submit assignment" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/your draft has not left this browser/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create account" }),
    ).toHaveAttribute(
      "href",
      "/account?next=%2Flearn%2Fweb-development-foundations%2Fsemantic-html",
    );
    expect(
      screen.queryByRole("button", { name: "Download saved .html" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("First check to repair")).not.toBeInTheDocument();
  });

  it("recovers a local draft after sign-in and keeps it visibly unsaved", async () => {
    const localHtml = "<main><article>Keep this first draft</article></main>";
    const { unmount } = render(
      <SemanticHtmlWorkspace
        lessonSlug="semantic-html"
        initialHtml="<main></main>"
        initialChecks={initialChecks}
        initiallySaved={false}
        isSignedIn={false}
      />,
    );
    fireEvent.change(screen.getByLabelText("Semantic HTML"), {
      target: { value: localHtml },
    });
    unmount();

    render(
      <SemanticHtmlWorkspace
        lessonSlug="semantic-html"
        initialHtml="<main></main>"
        initialChecks={initialChecks}
        initiallySaved={false}
        isSignedIn
      />,
    );

    expect(await screen.findByLabelText("Semantic HTML")).toHaveValue(
      localHtml,
    );
    expect(
      screen.getByText(
        "Browser draft restored after sign-in. It is still unsaved. Submit when you’re ready.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Download saved .html" }),
    ).not.toBeInTheDocument();
  });

  it("keeps account-owned source authoritative over a browser draft", async () => {
    const { unmount } = render(
      <SemanticHtmlWorkspace
        lessonSlug="semantic-html"
        initialHtml="<main></main>"
        initialChecks={initialChecks}
        initiallySaved={false}
        isSignedIn={false}
      />,
    );
    fireEvent.change(screen.getByLabelText("Semantic HTML"), {
      target: { value: "<main>Anonymous draft</main>" },
    });
    unmount();

    render(
      <SemanticHtmlWorkspace
        lessonSlug="semantic-html"
        initialHtml="<main>Account-owned source</main>"
        initialChecks={initialChecks}
        initiallySaved
        isSignedIn
      />,
    );

    expect(await screen.findByLabelText("Semantic HTML")).toHaveValue(
      "<main>Account-owned source</main>",
    );
    expect(
      screen.queryByText(/browser draft restored/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Saved result")).toBeInTheDocument();
  });
});

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  });

  afterEach(() => {
    cleanup();
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
    const savedChecks = initialChecks.map((check) => ({ ...check, passed: true }));
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
        screen.getByText("Assignment complete. Your HTML and 5/5 result are saved."),
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
  });

  it("keeps newer edits visibly unsaved when an older submission finishes", async () => {
    const submittedHtml = "<main><article>Submitted draft</article></main>";
    const newerHtml = "<main><article>Newer unsaved draft</article></main>";
    const savedChecks = initialChecks.map((check) => ({ ...check, passed: true }));
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
      screen.queryByText("Assignment complete. Your HTML and 5/5 result are saved."),
    ).not.toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: "Submit assignment" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/your draft has not left this browser/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute(
      "href",
      "/account",
    );
    expect(
      screen.queryByRole("button", { name: "Download saved .html" }),
    ).not.toBeInTheDocument();
  });
});

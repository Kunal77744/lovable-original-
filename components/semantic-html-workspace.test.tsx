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
    fireEvent.click(screen.getByRole("button", { name: "Save & check" }));

    await waitFor(() =>
      expect(screen.getByText("Saved to your account. All five structure checks pass.")).toBeInTheDocument(),
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
  });
});

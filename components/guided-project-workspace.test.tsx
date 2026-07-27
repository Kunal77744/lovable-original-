import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getEmptyGuidedProjectChecks,
  type GuidedProjectRecord,
} from "@/lib/guided-project";
import { GuidedProjectWorkspace } from "./guided-project-workspace";

const starterProject: GuidedProjectRecord = {
  html: "<main><article></article></main>",
  saved: false,
  updatedAt: null,
  hasUnreviewedChanges: false,
  submission: null,
};

describe("GuidedProjectWorkspace", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("saves an exact draft separately from project review", async () => {
    const revisedHtml = "<main><article><h1>My guide</h1></article></main>";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...starterProject,
        html: revisedHtml,
        saved: true,
        updatedAt: "2026-07-27T18:00:00.000Z",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <GuidedProjectWorkspace
        projectSlug="semantic-html-article"
        initialProject={starterProject}
      />,
    );

    fireEvent.change(screen.getByLabelText("Semantic HTML project"), {
      target: { value: revisedHtml },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() =>
      expect(
        screen.getByText("Draft saved to your account."),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/projects/semantic-html-article",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "save", html: revisedHtml }),
      }),
    );
    expect(
      screen.getByRole("button", { name: "Submit for review" }),
    ).toBeInTheDocument();
  });

  it("shows a completed review and preserves a revision path", async () => {
    const completeHtml =
      "<header></header><main><article><h1>Guide</h1><p>Intro</p><section><h2>One</h2><p>Copy</p></section><section><h2>Two</h2><p>Copy</p></section><aside>Tip</aside></article></main><footer></footer>";
    const checks = getEmptyGuidedProjectChecks().map((check) => ({
      ...check,
      passed: true,
    }));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        html: completeHtml,
        saved: true,
        updatedAt: "2026-07-27T18:00:00.000Z",
        hasUnreviewedChanges: false,
        submission: {
          status: "completed",
          checks,
          passedChecks: 6,
          totalChecks: 6,
          submittedAt: "2026-07-27T18:00:00.000Z",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <GuidedProjectWorkspace
        projectSlug="semantic-html-article"
        initialProject={{ ...starterProject, html: completeHtml }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Submit for review" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Project complete. Your HTML and 6/6 review are saved.",
        ),
      ).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("6 of 6 review checks pass")).toBeInTheDocument();
    expect(screen.getByText("Project complete")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit updated project" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View saved progress/ }),
    ).toHaveAttribute("href", "/dashboard");
  });

  it("keeps the live preview in an empty sandbox", () => {
    render(
      <GuidedProjectWorkspace
        projectSlug="semantic-html-article"
        initialProject={{
          ...starterProject,
          html: '<img src="https://example.com/track.png"><script>alert(1)</script>',
        }}
      />,
    );

    const preview = screen.getByTitle("Guided project live preview");
    expect(preview).toHaveAttribute("sandbox", "");
    expect(preview).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(preview.getAttribute("srcdoc")).toContain("default-src 'none'");
    expect(preview.getAttribute("srcdoc")).not.toContain("https://example.com");
    expect(preview.getAttribute("srcdoc")).not.toContain("<script");
  });
});

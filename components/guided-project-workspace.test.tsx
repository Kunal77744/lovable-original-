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

const analyticsMocks = vi.hoisted(() => ({
  captureProjectCompleted: vi.fn(),
}));

vi.mock("@/lib/product-analytics", () => analyticsMocks);

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
    analyticsMocks.captureProjectCompleted.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("saves an exact draft separately from project review", async () => {
    const revisedHtml = "<main><article><h1>My guide</h1></article></main>";
    let resolveSave: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveSave = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <GuidedProjectWorkspace
        projectSlug="semantic-html-article"
        initialProject={starterProject}
        initialFeedback={null}
        practiceContinuation={{
          href: "/practice/sum-two-numbers",
          label: "Continue to JavaScript step 01: Sum two numbers",
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Semantic HTML project"), {
      target: { value: revisedHtml },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    expect(screen.getByText("Saving your project draft…")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Saving…" }),
    ).toBeDisabled();

    resolveSave?.({
      ok: true,
      json: async () => ({
        ...starterProject,
        html: revisedHtml,
        saved: true,
        updatedAt: "2026-07-27T18:00:00.000Z",
      }),
    } as Response);

    await waitFor(() =>
      expect(
        screen.getByText("Saved privately to your account."),
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

  it("keeps a failed draft save recoverable", async () => {
    const revisedHtml = "<main><article><h1>Try again</h1></article></main>";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: "The project could not be saved. Try again.",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <GuidedProjectWorkspace
        projectSlug="semantic-html-article"
        initialProject={starterProject}
        initialFeedback={null}
        practiceContinuation={{
          href: "/practice/sum-two-numbers",
          label: "Continue to JavaScript step 01: Sum two numbers",
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Semantic HTML project"), {
      target: { value: revisedHtml },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() =>
      expect(
        screen.getByText("The project could not be saved. Try again."),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled();
    expect(screen.getByText("Unsaved")).toBeInTheDocument();
  });

  it("keeps newer edits visibly unsaved when an older draft save finishes", async () => {
    const submittedHtml = "<main><article><h1>Saved draft</h1></article></main>";
    const newerHtml = "<main><article><h1>Newer unsaved draft</h1></article></main>";
    let resolveSave: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveSave = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <GuidedProjectWorkspace
        projectSlug="semantic-html-article"
        initialProject={starterProject}
        initialFeedback={null}
        practiceContinuation={{
          href: "/practice/sum-two-numbers",
          label: "Continue to JavaScript step 01: Sum two numbers",
        }}
      />,
    );

    const editor = screen.getByLabelText("Semantic HTML project");
    fireEvent.change(editor, { target: { value: submittedHtml } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    fireEvent.change(editor, { target: { value: newerHtml } });

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Submit for review" }),
    ).toBeDisabled();

    resolveSave?.({
      ok: true,
      json: async () => ({
        ...starterProject,
        html: submittedHtml,
        saved: true,
        updatedAt: "2026-08-06T18:00:00.000Z",
      }),
    } as Response);

    await waitFor(() =>
      expect(
        screen.getByText(
          "Your saved draft is safe. Newer changes are still unsaved.",
        ),
      ).toBeInTheDocument(),
    );
    expect(editor).toHaveValue(newerHtml);
    expect(screen.getByText("Unsaved")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled();
    expect(
      screen.queryByText("Saved privately to your account."),
    ).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/projects/semantic-html-article",
      expect.objectContaining({
        body: JSON.stringify({ action: "save", html: submittedHtml }),
      }),
    );
  });

  it("keeps newer edits visibly unreviewed when an older submission finishes", async () => {
    const submittedHtml =
      "<header></header><main><article><h1>Submitted guide</h1><p>Intro</p><section><h2>One</h2><p>Copy</p></section><section><h2>Two</h2><p>Copy</p></section><aside>Tip</aside></article></main><footer></footer>";
    const newerHtml = submittedHtml.replace("Submitted guide", "Newer guide");
    const checks = getEmptyGuidedProjectChecks().map((check) => ({
      ...check,
      passed: true,
    }));
    let resolveSubmit: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveSubmit = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <GuidedProjectWorkspace
        projectSlug="semantic-html-article"
        initialProject={{ ...starterProject, html: submittedHtml }}
        initialFeedback={null}
        practiceContinuation={{
          href: "/practice/sum-two-numbers",
          label: "Continue to JavaScript step 01: Sum two numbers",
        }}
      />,
    );

    const editor = screen.getByLabelText("Semantic HTML project");
    fireEvent.click(screen.getByRole("button", { name: "Submit for review" }));
    fireEvent.change(editor, { target: { value: newerHtml } });

    expect(screen.getByRole("button", { name: "Reviewing…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();

    resolveSubmit?.({
      ok: true,
      json: async () => ({
        html: submittedHtml,
        saved: true,
        updatedAt: "2026-08-06T18:00:00.000Z",
        hasUnreviewedChanges: false,
        submission: {
          status: "completed",
          checks,
          passedChecks: 6,
          totalChecks: 6,
          submittedAt: "2026-08-06T18:00:00.000Z",
        },
        firstCompletedReview: true,
      }),
    } as Response);

    await waitFor(() =>
      expect(
        screen.getByText(
          "Your submitted review is saved. Newer changes are still unsaved and unreviewed.",
        ),
      ).toBeInTheDocument(),
    );
    expect(editor).toHaveValue(newerHtml);
    expect(screen.getByText("Unsaved")).toBeInTheDocument();
    expect(screen.getByText("Changes since review")).toBeInTheDocument();
    expect(screen.getByText("Needs revision")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Submit updated project" }),
    ).toBeEnabled();
    expect(analyticsMocks.captureProjectCompleted).toHaveBeenCalledOnce();
  });

  it("turns the first failed review check into a focused repair drill", () => {
    const checks = getEmptyGuidedProjectChecks().map((check) => ({
      ...check,
      passed: check.id !== "article-introduction",
    }));

    render(
      <GuidedProjectWorkspace
        projectSlug="semantic-html-article"
        initialProject={{
          ...starterProject,
          saved: true,
          submission: {
            status: "needs-revision",
            checks,
            passedChecks: 5,
            totalChecks: 6,
            submittedAt: "2026-07-29T10:00:00.000Z",
          },
        }}
        initialFeedback={null}
        practiceContinuation={{
          href: "/practice/sum-two-numbers",
          label: "Continue to JavaScript step 01: Sum two numbers",
        }}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Lead with the topic before the introduction.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your review flagged:/),
    ).toHaveTextContent("Open with a clear topic and introduction");

    fireEvent.click(screen.getByLabelText(/Repair 2/));
    fireEvent.click(screen.getByRole("button", { name: "Check repair" }));
    expect(
      screen.getByText(
        "Not yet. Put the article's single h1 before its opening paragraph.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Repair 1/));
    fireEvent.click(screen.getByRole("button", { name: "Check repair" }));
    expect(
      screen.getByText(
        "Correct. The h1 names the topic before the opening paragraph develops it.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /Use this pattern in field-guide.html/,
      }),
    ).toHaveAttribute("href", "#guided-project-editor");
  });

  it("shows a completed review and preserves a revision path", async () => {
    const completeHtml =
      "<header></header><main><article><h1>Guide</h1><p>Intro</p><section><h2>One</h2><p>Copy</p></section><section><h2>Two</h2><p>Copy</p></section><aside>Tip</aside></article></main><footer></footer>";
    const checks = getEmptyGuidedProjectChecks().map((check) => ({
      ...check,
      passed: true,
    }));
    const completedProject = {
      html: completeHtml,
      saved: true,
      updatedAt: "2026-07-27T18:00:00.000Z",
      hasUnreviewedChanges: false,
      submission: {
        status: "completed" as const,
        checks,
        passedChecks: 6,
        totalChecks: 6,
        submittedAt: "2026-07-27T18:00:00.000Z",
      },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...completedProject,
          firstCompletedReview: true,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...completedProject,
          firstCompletedReview: false,
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <GuidedProjectWorkspace
        projectSlug="semantic-html-article"
        initialProject={{ ...starterProject, html: completeHtml }}
        initialFeedback={null}
        practiceContinuation={{
          href: "/practice/multiplication-table",
          label: "Continue to JavaScript step 03: Multiplication table",
        }}
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
      screen.getByRole("link", {
        name: /Continue to JavaScript step 03: Multiplication table/,
      }),
    ).toHaveAttribute("href", "/practice/multiplication-table");
    expect(
      screen.getByRole("link", { name: /Open private project debrief/ }),
    ).toHaveAttribute("href", "/projects/semantic-html-article/debrief");
    expect(
      screen.getByRole("heading", {
        name: "What felt confusing while you built this?",
      }),
    ).toBeInTheDocument();
    expect(analyticsMocks.captureProjectCompleted).toHaveBeenCalledOnce();
    expect(analyticsMocks.captureProjectCompleted).toHaveBeenCalledWith({
      projectSlug: "semantic-html-article",
      passedCheckCount: 6,
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Submit updated project" }),
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(analyticsMocks.captureProjectCompleted).toHaveBeenCalledOnce();
  });

  it("keeps the live preview in an empty sandbox", () => {
    render(
      <GuidedProjectWorkspace
        projectSlug="semantic-html-article"
        initialProject={{
          ...starterProject,
          html: '<img src="https://example.com/track.png"><script>alert(1)</script>',
        }}
        initialFeedback={null}
        practiceContinuation={{
          href: "/practice/sum-two-numbers",
          label: "Continue to JavaScript step 01: Sum two numbers",
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

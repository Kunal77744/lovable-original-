import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CSS_BOX_MODEL_STARTER,
  gradeCssBoxModel,
} from "@/lib/css-box-model-practice";
import { CssBoxModelWorkspace } from "./css-box-model-workspace";

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("CssBoxModelWorkspace", () => {
  it("keeps signed-out practice local until the learner chooses to save", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CssBoxModelWorkspace
        lessonSlug="css-selectors-box-model"
        initialCss={CSS_BOX_MODEL_STARTER}
        initialChecks={gradeCssBoxModel(CSS_BOX_MODEL_STARTER)}
        initiallySaved={false}
        isSignedIn={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Check and save CSS" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/create a free account to check and save this CSS/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create account" }),
    ).toHaveAttribute(
      "href",
      "/account?next=%2Flearn%2Fweb-development-foundations%2Fcss-selectors-box-model",
    );
    expect(
      screen.queryByRole("button", { name: "Download saved .css" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Review changes from starter"),
    ).not.toBeInTheDocument();
  });

  it("recovers the exact local CSS after sign-in", async () => {
    const localCss = ".learning-card { padding: 32px; }";
    const { unmount } = render(
      <CssBoxModelWorkspace
        lessonSlug="css-selectors-box-model"
        initialCss={CSS_BOX_MODEL_STARTER}
        initialChecks={gradeCssBoxModel(CSS_BOX_MODEL_STARTER)}
        initiallySaved={false}
        isSignedIn={false}
      />,
    );
    fireEvent.change(screen.getByLabelText("Card CSS"), {
      target: { value: localCss },
    });
    unmount();

    render(
      <CssBoxModelWorkspace
        lessonSlug="css-selectors-box-model"
        initialCss={CSS_BOX_MODEL_STARTER}
        initialChecks={gradeCssBoxModel(CSS_BOX_MODEL_STARTER)}
        initiallySaved={false}
        isSignedIn
      />,
    );

    expect(await screen.findByLabelText("Card CSS")).toHaveValue(localCss);
    expect(
      screen.getByText(/browser draft restored after sign-in/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Download saved .css" }),
    ).not.toBeInTheDocument();
  });

  it("saves the exact CSS and restores the server checks", async () => {
    const completedCss = `.learning-card {
      width: 280px;
      box-sizing: border-box;
      padding: 24px;
      border: 2px solid #287652;
    }
    .learning-card strong { color: #175437; }`;
    const checks = gradeCssBoxModel(completedCss);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        html: completedCss,
        checks,
        saved: true,
        updatedAt: "2026-08-01T00:00:00.000Z",
        submission: {
          status: "completed",
          passedChecks: 4,
          totalChecks: 4,
          submittedAt: "2026-08-01T00:00:00.000Z",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CssBoxModelWorkspace
        lessonSlug="css-selectors-box-model"
        initialCss={completedCss}
        initialChecks={checks.map((check) => ({ ...check, passed: false }))}
        initiallySaved={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Check and save CSS" }));

    await waitFor(() =>
      expect(
        screen.getByText(/CSS and 4\/4 result are saved/i),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lessons/css-selectors-box-model/workspace",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ html: completedCss }),
      }),
    );
    expect(screen.getByLabelText("4 of 4 checks pass")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download saved .css" }),
    ).toBeInTheDocument();
  });

  it("keeps newer CSS visibly unsaved when an older save finishes", async () => {
    const submittedCss = `.learning-card {
      width: 280px;
      box-sizing: border-box;
    }`;
    const newerCss = `${submittedCss}\n.learning-card { padding: 24px; }`;
    const savedChecks = gradeCssBoxModel(submittedCss);
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
        status: "needs-revision";
        passedChecks: number;
        totalChecks: number;
        submittedAt: string;
      };
    };
    const fetchMock = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveResponse = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CssBoxModelWorkspace
        lessonSlug="css-selectors-box-model"
        initialCss={CSS_BOX_MODEL_STARTER}
        initialChecks={gradeCssBoxModel(CSS_BOX_MODEL_STARTER)}
        initiallySaved={false}
      />,
    );

    const editor = screen.getByLabelText("Card CSS");
    fireEvent.change(editor, { target: { value: submittedCss } });
    fireEvent.click(screen.getByRole("button", { name: "Check and save CSS" }));
    fireEvent.change(editor, { target: { value: newerCss } });

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();

    resolveResponse({
      ok: true,
      json: async () => ({
        html: submittedCss,
        checks: savedChecks,
        saved: true,
        updatedAt: "2026-08-06T21:00:00.000Z",
        submission: {
          status: "needs-revision",
          passedChecks: savedChecks.filter((check) => check.passed).length,
          totalChecks: savedChecks.length,
          submittedAt: "2026-08-06T21:00:00.000Z",
        },
      }),
    });

    await waitFor(() =>
      expect(
        screen.getByText(
          "Your submitted result is saved. Newer CSS changes are still unsaved.",
        ),
      ).toBeInTheDocument(),
    );
    expect(editor).toHaveValue(newerCss);
    expect(screen.getByText("Changes not saved")).toBeInTheDocument();
    expect(screen.getByText("Previous result")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Check and save again" }),
    ).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lessons/css-selectors-box-model/workspace",
      expect.objectContaining({ body: JSON.stringify({ html: submittedCss }) }),
    );
    expect(
      screen.queryByRole("button", { name: "Download saved .css" }),
    ).not.toBeInTheDocument();
  });

  it("restores the authored lesson starter without changing saved CSS checks", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CssBoxModelWorkspace
        lessonSlug="css-selectors-box-model"
        initialCss=".learning-card { padding: 32px; border: 1px solid; }"
        initialChecks={gradeCssBoxModel(CSS_BOX_MODEL_STARTER)}
        initiallySaved
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Restore lesson starter" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Restore starter" }));

    expect(screen.getByLabelText("Card CSS")).toHaveValue(
      CSS_BOX_MODEL_STARTER,
    );
    expect(
      screen.getByText(
        "Lesson starter restored in the editor. Your saved result and checks have not changed.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Changes not saved")).toBeInTheDocument();
    expect(screen.getByText("Previous result")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Download saved .css" }),
    ).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reviews signed-in CSS changes from the authored starter without saving", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CssBoxModelWorkspace
        lessonSlug="css-selectors-box-model"
        initialCss={CSS_BOX_MODEL_STARTER}
        initialChecks={gradeCssBoxModel(CSS_BOX_MODEL_STARTER)}
        initiallySaved={false}
      />,
    );

    fireEvent.change(screen.getByLabelText("Card CSS"), {
      target: { value: `${CSS_BOX_MODEL_STARTER}\n/* explain the width */` },
    });
    fireEvent.click(screen.getByText("Review changes from starter"));

    expect(screen.getByText("1 added")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Changes from the authored starter" }),
    ).toHaveTextContent("/* explain the width */");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

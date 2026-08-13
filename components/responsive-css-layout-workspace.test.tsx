import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  gradeResponsiveCss,
  RESPONSIVE_CSS_STARTER,
} from "@/lib/responsive-css-practice";
import { ResponsiveCssLayoutWorkspace } from "./responsive-css-layout-workspace";

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const completedCss = `.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1rem;
}
.resource-card { min-width: 0; }`;

describe("ResponsiveCssLayoutWorkspace", () => {
  it("keeps keyboard editing inside the responsive CSS workspace until Escape", () => {
    render(
      <ResponsiveCssLayoutWorkspace
        lessonSlug="responsive-css-grid"
        initialCss=".resource-grid { display: grid; }"
        initialChecks={gradeResponsiveCss(RESPONSIVE_CSS_STARTER)}
        initiallySaved={false}
        isSignedIn={false}
      />,
    );

    const editor = screen.getByLabelText(
      "Responsive layout CSS",
    ) as HTMLTextAreaElement;
    editor.setSelectionRange(0, editor.value.length);
    expect(fireEvent.keyDown(editor, { key: "Tab" })).toBe(false);
    expect(editor).toHaveValue("  .resource-grid { display: grid; }");

    fireEvent.keyDown(editor, { key: "Escape" });
    expect(fireEvent.keyDown(editor, { key: "Tab" })).toBe(true);
    expect(editor).toHaveAttribute(
      "aria-describedby",
      "responsive-css-editor-keyboard-hint",
    );
  });

  it("keeps signed-out work in the browser", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ResponsiveCssLayoutWorkspace
        lessonSlug="responsive-css-grid"
        initialCss={RESPONSIVE_CSS_STARTER}
        initialChecks={gradeResponsiveCss(RESPONSIVE_CSS_STARTER)}
        initiallySaved={false}
        isSignedIn={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Check and save CSS" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/draft has not left this browser/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Download saved .css" }),
    ).not.toBeInTheDocument();
  });

  it("saves the exact responsive CSS and restores 4/4", async () => {
    const checks = gradeResponsiveCss(completedCss);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        html: completedCss,
        checks,
        saved: true,
        updatedAt: "2026-08-07T00:00:00.000Z",
        submission: {
          status: "completed",
          passedChecks: 4,
          totalChecks: 4,
          submittedAt: "2026-08-07T00:00:00.000Z",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ResponsiveCssLayoutWorkspace
        lessonSlug="responsive-css-grid"
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
      "/api/lessons/responsive-css-grid/workspace",
      expect.objectContaining({ body: JSON.stringify({ html: completedCss }) }),
    );
    expect(
      screen.getByRole("button", { name: "Download saved .css" }),
    ).toBeInTheDocument();
  });

  it("recovers the exact local responsive CSS after sign-in", async () => {
    const { unmount } = render(
      <ResponsiveCssLayoutWorkspace
        lessonSlug="responsive-css-grid"
        initialCss={RESPONSIVE_CSS_STARTER}
        initialChecks={gradeResponsiveCss(RESPONSIVE_CSS_STARTER)}
        initiallySaved={false}
        isSignedIn={false}
      />,
    );
    fireEvent.change(screen.getByLabelText("Responsive layout CSS"), {
      target: { value: completedCss },
    });
    unmount();

    render(
      <ResponsiveCssLayoutWorkspace
        lessonSlug="responsive-css-grid"
        initialCss={RESPONSIVE_CSS_STARTER}
        initialChecks={gradeResponsiveCss(RESPONSIVE_CSS_STARTER)}
        initiallySaved={false}
        isSignedIn
      />,
    );

    expect(await screen.findByLabelText("Responsive layout CSS")).toHaveValue(
      completedCss,
    );
    expect(screen.getByText(/browser draft restored after sign-in/i)).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Download saved .css" }),
    ).not.toBeInTheDocument();
  });
});

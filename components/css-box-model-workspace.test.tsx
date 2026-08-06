import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CSS_BOX_MODEL_STARTER, gradeCssBoxModel } from "@/lib/css-box-model-practice";
import { CssBoxModelWorkspace } from "./css-box-model-workspace";

afterEach(cleanup);

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
    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute(
      "href",
      "/account",
    );
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
      expect(screen.getByText(/CSS and 4\/4 result are saved/i)).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lessons/css-selectors-box-model/workspace",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ html: completedCss }),
      }),
    );
    expect(screen.getByLabelText("4 of 4 checks pass")).toBeInTheDocument();
  });
});

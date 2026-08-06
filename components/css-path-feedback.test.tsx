import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CssPathFeedback } from "./css-path-feedback";

const captureCssPathFeedbackSubmitted = vi.fn();

vi.mock("@/lib/product-analytics", () => ({
  captureCssPathFeedbackSubmitted: (...args: unknown[]) =>
    captureCssPathFeedbackSubmitted(...args),
}));

afterEach(() => {
  cleanup();
  captureCssPathFeedbackSubmitted.mockReset();
  vi.restoreAllMocks();
});

describe("CssPathFeedback", () => {
  it("saves one bounded response and excludes the comment from analytics", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        feedback: {
          pathSlug: "css-selectors-box-model",
          usefulness: "very",
          comment: "The checks made selectors click.",
          updatedAt: "2026-08-03T12:00:00.000Z",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<CssPathFeedback initialFeedback={null} />);
    fireEvent.click(screen.getByRole("radio", { name: "Very useful" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "The checks made selectors click." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save response" }));

    await waitFor(() =>
      expect(
        screen.getByText(/private response is saved/i),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/practice/css/feedback",
      expect.objectContaining({
        body: JSON.stringify({
          usefulness: "very",
          comment: "The checks made selectors click.",
        }),
      }),
    );
    expect(captureCssPathFeedbackSubmitted).toHaveBeenCalledWith("very");
    expect(
      JSON.stringify(captureCssPathFeedbackSubmitted.mock.calls),
    ).not.toMatch(/checks made selectors click/i);
  });

  it("restores and revises the exact private response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        feedback: {
          pathSlug: "css-selectors-box-model",
          usefulness: "somewhat",
          comment: "More box-model examples would help.",
          updatedAt: "2026-08-03T12:05:00.000Z",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CssPathFeedback
        initialFeedback={{
          pathSlug: "css-selectors-box-model",
          usefulness: "not_yet",
          comment: "Selectors were still confusing.",
          updatedAt: "2026-08-03T12:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByRole("radio", { name: "Not yet" })).toBeChecked();
    expect(screen.getByRole("textbox")).toHaveValue(
      "Selectors were still confusing.",
    );

    fireEvent.click(screen.getByRole("radio", { name: "Somewhat" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "More box-model examples would help." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update response" }));

    await waitFor(() =>
      expect(screen.getByRole("textbox")).toHaveValue(
        "More box-model examples would help.",
      ),
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("keeps newer feedback edits intact when an older save finishes", async () => {
    let resolveSave!: (value: Response) => void;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveSave = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<CssPathFeedback initialFeedback={null} />);
    fireEvent.click(screen.getByRole("radio", { name: "Somewhat" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "The selector checks helped." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save response" }));

    fireEvent.click(screen.getByRole("radio", { name: "Very useful" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "The recovery prompts helped even more." },
    });

    resolveSave(
      new Response(
        JSON.stringify({
          feedback: {
            pathSlug: "css-selectors-box-model",
            usefulness: "somewhat",
            comment: "The selector checks helped.",
            updatedAt: "2026-08-06T21:00:00.000Z",
          },
        }),
      ),
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          "Your earlier response is saved. Newer changes are still unsaved.",
        ),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("radio", { name: "Very useful" })).toBeChecked();
    expect(screen.getByRole("textbox")).toHaveValue(
      "The recovery prompts helped even more.",
    );
    expect(screen.getByRole("button", { name: "Update response" })).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/practice/css/feedback",
      expect.objectContaining({
        body: JSON.stringify({
          usefulness: "somewhat",
          comment: "The selector checks helped.",
        }),
      }),
    );
  });
});

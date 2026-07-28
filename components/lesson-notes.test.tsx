import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LessonNotes } from "./lesson-notes";

describe("LessonNotes", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("saves the exact note without sending it to analytics", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        note: {
          content: "  Landmarks explain each region.\n",
          updatedAt: "2026-07-26T22:00:00.000Z",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<LessonNotes lessonSlug="semantic-html" initialNote={null} />);

    fireEvent.change(screen.getByLabelText("What do you want to remember?"), {
      target: { value: "  Landmarks explain each region.\n" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));

    await waitFor(() =>
      expect(
        screen.getByText("Note saved. It will return with your account."),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lessons/semantic-html/notes",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          content: "  Landmarks explain each region.\n",
        }),
      }),
    );
    expect(screen.getByRole("button", { name: "Update note" })).toBeDisabled();
  });

  it("restores a saved note and allows a revision", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          note: {
            content: "Article is standalone; section groups one idea.",
            updatedAt: "2026-07-26T22:05:00.000Z",
          },
        }),
      }),
    );

    render(
      <LessonNotes
        lessonSlug="semantic-html"
        initialNote={{
          content: "Article stands alone.",
          updatedAt: "2026-07-26T22:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByDisplayValue("Article stands alone.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update note" })).toBeDisabled();

    fireEvent.change(screen.getByDisplayValue("Article stands alone."), {
      target: { value: "Article is standalone; section groups one idea." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update note" }));

    await waitFor(() =>
      expect(
        screen.getByDisplayValue(
          "Article is standalone; section groups one idea.",
        ),
      ).toBeInTheDocument(),
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/lessons/semantic-html/notes",
      expect.objectContaining({
        body: JSON.stringify({
          content: "Article is standalone; section groups one idea.",
        }),
      }),
    );
  });

  it("keeps a signed-out note local until the learner tries to save", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LessonNotes
        lessonSlug="semantic-html"
        initialNote={null}
        isSignedIn={false}
      />,
    );

    expect(
      screen.queryByRole("link", { name: "Create account" }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("What do you want to remember?"), {
      target: { value: "A landmark names a region's purpose." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/your draft has not left this browser/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute(
      "href",
      "/account",
    );
  });
});

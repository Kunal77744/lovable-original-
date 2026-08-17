import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuidedJavaScriptAttemptNote } from "./guided-javascript-attempt-note";

const props = {
  labSlug: "functions",
  exerciseId: "greet-user",
  showEmpty: true,
};

describe("GuidedJavaScriptAttemptNote", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("restores and revises the exact account-owned exercise note", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          note: {
            content: "The branch does not return.",
            updatedAt: "2026-08-17T10:00:00.000Z",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          note: {
            content: "The second branch does not return.",
            updatedAt: "2026-08-17T10:05:00.000Z",
          },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<GuidedJavaScriptAttemptNote {...props} />);

    const note = await screen.findByDisplayValue("The branch does not return.");
    expect(screen.getByText(/saved note is back/i)).toBeInTheDocument();
    fireEvent.change(note, {
      target: { value: "The second branch does not return." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update note" }));

    await screen.findByText(
      "Changes saved. This note will return with your account.",
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/practice/labs/functions/greet-user/note",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          content: "The second branch does not return.",
        }),
      }),
    );
  });

  it("shows empty notes only after a failed attempt", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ note: null }) }),
    );

    const { rerender } = render(
      <GuidedJavaScriptAttemptNote {...props} showEmpty={false} />,
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByRole("heading", { name: "Plan the next repair." }),
    ).not.toBeInTheDocument();

    rerender(<GuidedJavaScriptAttemptNote {...props} showEmpty />);
    expect(
      await screen.findByRole("heading", { name: "Plan the next repair." }),
    ).toBeInTheDocument();
  });

  it("keeps newer typing unsaved when an older save finishes", async () => {
    let finishSave: ((value: unknown) => void) | undefined;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          note: {
            content: "Initial note.",
            updatedAt: "2026-08-17T10:00:00.000Z",
          },
        }),
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishSave = resolve;
          }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<GuidedJavaScriptAttemptNote {...props} />);

    const note = await screen.findByLabelText(
      "What broke, and what will you try next?",
    );
    fireEvent.change(note, { target: { value: "Earlier revision." } });
    fireEvent.click(screen.getByRole("button", { name: "Update note" }));
    fireEvent.change(note, { target: { value: "Newest revision." } });

    finishSave?.({
      ok: true,
      json: async () => ({
        note: {
          content: "Earlier revision.",
          updatedAt: "2026-08-17T10:05:00.000Z",
        },
      }),
    });

    await screen.findByText(
      "Your earlier note was saved. Your newer changes are still unsaved.",
    );
    expect(note).toHaveValue("Newest revision.");
    expect(screen.getByRole("button", { name: "Update note" })).toBeEnabled();
  });

  it("keeps a failed save retryable", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ note: null }) })
      .mockRejectedValueOnce(new Error("connection failed"));
    vi.stubGlobal("fetch", fetchMock);

    render(<GuidedJavaScriptAttemptNote {...props} />);

    fireEvent.change(
      await screen.findByLabelText("What broke, and what will you try next?"),
      { target: { value: "Inspect the return branch." } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));

    await screen.findByText(/couldn’t save your note/i);
    expect(screen.getByRole("button", { name: "Save note" })).toBeEnabled();
  });
});

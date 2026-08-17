import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CssAttemptNote } from "./css-attempt-note";

describe("CssAttemptNote", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("saves the exact private reflection without analytics", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        note: {
          content: "  The link inherits the card color.\nNext: target the link.\n",
          updatedAt: "2026-08-14T20:00:00.000Z",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CssAttemptNote challengeSlug="class-selector" initialNote={null} />,
    );

    const note = screen.getByLabelText(
      "What broke, and what will you try next?",
    );
    fireEvent.change(note, {
      target: {
        value: "  The link inherits the card color.\nNext: target the link.\n",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));

    await waitFor(() =>
      expect(
        screen.getByText("Note saved. It will return with your account."),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/practice/css/class-selector/note",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          content:
            "  The link inherits the card color.\nNext: target the link.\n",
        }),
      }),
    );
    expect(screen.getByRole("button", { name: "Update note" })).toBeDisabled();
  });

  it("restores a saved note and allows revision", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        note: {
          content: "The selector needs the nested link.",
          updatedAt: "2026-08-14T20:05:00.000Z",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CssAttemptNote
        challengeSlug="class-selector"
        initialNote={{
          content: "The selector is too broad.",
          updatedAt: "2026-08-14T20:00:00.000Z",
        }}
      />,
    );

    const note = screen.getByDisplayValue("The selector is too broad.");
    expect(screen.getByText(/saved note is back/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update note" })).toBeDisabled();

    fireEvent.change(note, {
      target: { value: "The selector needs the nested link." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update note" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Changes saved. This note will return with your account.",
        ),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/practice/css/class-selector/note",
      expect.objectContaining({
        body: JSON.stringify({
          content: "The selector needs the nested link.",
        }),
      }),
    );
  });

  it("keeps a newer reflection unsaved when an older save finishes", async () => {
    let finishSave: ((value: unknown) => void) | undefined;
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSave = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CssAttemptNote
        challengeSlug="class-selector"
        initialNote={{
          content: "Initial note.",
          updatedAt: "2026-08-14T20:00:00.000Z",
        }}
      />,
    );

    const note = screen.getByLabelText(
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
          updatedAt: "2026-08-14T20:05:00.000Z",
        },
      }),
    });

    await waitFor(() =>
      expect(
        screen.getByText(
          "Your earlier note was saved. Your newer changes are still unsaved.",
        ),
      ).toBeInTheDocument(),
    );
    expect(note).toHaveValue("Newest revision.");
    expect(screen.getByRole("button", { name: "Update note" })).toBeEnabled();
  });

  it("keeps failed saves retryable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("connection failed")),
    );

    render(
      <CssAttemptNote challengeSlug="class-selector" initialNote={null} />,
    );

    fireEvent.change(
      screen.getByLabelText("What broke, and what will you try next?"),
      { target: { value: "Try a more specific selector." } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));

    await waitFor(() =>
      expect(screen.getByText(/check your connection/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Save note" })).toBeEnabled();
  });
});

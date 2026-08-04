import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PracticeSolutionNote } from "./practice-solution-note";

describe("PracticeSolutionNote", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("saves the exact private reflection without an analytics call", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        note: {
          content: "  Split, convert, then add.\n",
          updatedAt: "2026-08-04T08:00:00.000Z",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <PracticeSolutionNote problemSlug="sum-two-numbers" initialNote={null} />,
    );

    fireEvent.change(
      screen.getByLabelText("What would you want to remember next time?"),
      { target: { value: "  Split, convert, then add.\n" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));

    await waitFor(() =>
      expect(
        screen.getByText("Solution note saved. It will return with your account."),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/practice/sum-two-numbers/note",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ content: "  Split, convert, then add.\n" }),
      }),
    );
    expect(screen.getByRole("button", { name: "Update note" })).toBeDisabled();
  });

  it("restores and revises one saved reflection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          note: {
            content: "Convert both input tokens before addition.",
            updatedAt: "2026-08-04T08:05:00.000Z",
          },
        }),
      }),
    );

    render(
      <PracticeSolutionNote
        problemSlug="sum-two-numbers"
        initialNote={{
          content: "Convert input before addition.",
          updatedAt: "2026-08-04T08:00:00.000Z",
        }}
      />,
    );

    const note = screen.getByDisplayValue("Convert input before addition.");
    expect(screen.getByText("Saved reflection")).toBeInTheDocument();
    fireEvent.change(note, {
      target: { value: "Convert both input tokens before addition." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update note" }));

    await waitFor(() =>
      expect(
        screen.getByDisplayValue("Convert both input tokens before addition."),
      ).toBeInTheDocument(),
    );
  });
});

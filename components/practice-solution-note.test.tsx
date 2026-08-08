import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  parsePracticeJournal,
  serializePracticeJournal,
} from "@/lib/practice-solution-note";
import { PracticeSolutionNote } from "./practice-solution-note";

describe("PracticeSolutionNote", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("requires and saves a structured plan before Accepted", async () => {
    const savedJournal = {
      inputShape: "Two integers separated by one space.",
      edgeCase: "Negative values.",
      steps: "Split, convert both values, add, then return.",
      reflection: "",
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        note: {
          content: serializePracticeJournal(savedJournal),
          updatedAt: "2026-08-04T08:00:00.000Z",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <PracticeSolutionNote
        problemSlug="sum-two-numbers"
        initialNote={null}
        isAccepted={false}
      />,
    );

    expect(screen.getByText("Stage 1 · Plan")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Input shape"), {
      target: { value: savedJournal.inputShape },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save plan" }));
    expect(
      screen.getByText(
        "Name the input shape, one edge case, and your ordered approach.",
      ),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Edge case"), {
      target: { value: savedJournal.edgeCase },
    });
    fireEvent.change(screen.getByLabelText("Ordered approach"), {
      target: { value: savedJournal.steps },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save plan" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Plan saved. Return after Accepted to compare it with what worked.",
        ),
      ).toBeInTheDocument(),
    );
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body)) as { content: string };
    expect(parsePracticeJournal(body.content)).toEqual(savedJournal);
    expect(screen.getByRole("button", { name: "Update plan" })).toBeDisabled();
  });

  it("restores the plan and adds a post-Accepted reflection", async () => {
    const initialJournal = {
      inputShape: "Two integers.",
      edgeCase: "Negative values.",
      steps: "Split, convert, add.",
      reflection: "",
    };
    const revisedJournal = {
      ...initialJournal,
      reflection: "Converting both tokens first avoids string concatenation.",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          note: {
            content: serializePracticeJournal(revisedJournal),
            updatedAt: "2026-08-04T08:05:00.000Z",
          },
        }),
      }),
    );

    render(
      <PracticeSolutionNote
        problemSlug="sum-two-numbers"
        initialNote={{
          content: serializePracticeJournal(initialJournal),
          updatedAt: "2026-08-04T08:00:00.000Z",
        }}
        isAccepted
      />,
    );

    expect(screen.getByText("Stage 2 · Reflect")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Negative values.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Post-Accepted reflection"), {
      target: { value: revisedJournal.reflection },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update journal" }));

    await waitFor(() =>
      expect(screen.getByDisplayValue(revisedJournal.reflection)).toBeInTheDocument(),
    );
  });

  it("restores a legacy solution note as the reflection without losing it", () => {
    render(
      <PracticeSolutionNote
        problemSlug="sum-two-numbers"
        initialNote={{
          content: "Convert both input tokens before addition.",
          updatedAt: "2026-08-04T08:00:00.000Z",
        }}
        isAccepted
      />,
    );

    expect(
      screen.getByDisplayValue("Convert both input tokens before addition."),
    ).toBeInTheDocument();
  });
});

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

  it("keeps newer journal writing unsaved when an older save finishes late", async () => {
    const firstJournal = {
      inputShape: "Two integers.",
      edgeCase: "Negative values.",
      steps: "Split, convert, add.",
      reflection: "Converting both tokens avoids string concatenation.",
    };
    const newerReflection =
      "Converting both tokens avoids string concatenation and handles whitespace.";
    let resolveFirstSave: (response: Response) => void = () => undefined;
    const firstSave = new Promise<Response>((resolve) => {
      resolveFirstSave = resolve;
    });
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(firstSave)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            note: {
              content: serializePracticeJournal({
                ...firstJournal,
                reflection: newerReflection,
              }),
              updatedAt: "2026-08-09T13:01:00.000Z",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <PracticeSolutionNote
        problemSlug="sum-two-numbers"
        initialNote={{
          content: serializePracticeJournal({
            ...firstJournal,
            reflection: "",
          }),
          updatedAt: "2026-08-09T13:00:00.000Z",
        }}
        isAccepted
      />,
    );

    const reflection = screen.getByLabelText("Post-Accepted reflection");
    fireEvent.change(reflection, {
      target: { value: firstJournal.reflection },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update journal" }));

    fireEvent.change(reflection, { target: { value: newerReflection } });
    resolveFirstSave(
      new Response(
        JSON.stringify({
          note: {
            content: serializePracticeJournal(firstJournal),
            updatedAt: "2026-08-09T13:00:30.000Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    expect(
      await screen.findByText(
        "Your earlier journal is saved. Newer writing is still unsaved.",
      ),
    ).toBeInTheDocument();
    expect(reflection).toHaveValue(newerReflection);

    fireEvent.click(screen.getByRole("button", { name: "Update journal" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const secondRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;
    const secondBody = JSON.parse(String(secondRequest.body)) as {
      content: string;
    };
    expect(parsePracticeJournal(secondBody.content).reflection).toBe(
      newerReflection,
    );
  });
});

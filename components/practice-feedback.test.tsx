import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PracticeFeedback } from "./practice-feedback";

const capturePracticeFeedbackSubmitted = vi.fn();

vi.mock("@/lib/product-analytics", () => ({
  capturePracticeFeedbackSubmitted: (...args: unknown[]) =>
    capturePracticeFeedbackSubmitted(...args),
}));

describe("PracticeFeedback", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.restoreAllMocks();
    capturePracticeFeedbackSubmitted.mockReset();
  });

  it("saves and revises one private response without exposing its text", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            feedback: {
              problemSlug: "sum-two-numbers",
              usefulness: "somewhat",
              comment: "The examples helped.",
              updatedAt: "2026-07-29T03:00:00.000Z",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            feedback: {
              problemSlug: "sum-two-numbers",
              usefulness: "very",
              comment: "The next-step link helped too.",
              updatedAt: "2026-07-29T03:05:00.000Z",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    render(
      <PracticeFeedback
        problemSlug="sum-two-numbers"
        initialFeedback={null}
      />,
    );

    fireEvent.click(screen.getByLabelText("Somewhat"));
    fireEvent.change(
      screen.getByPlaceholderText(
        "One detail about the problem, checks, or next step",
      ),
      { target: { value: "The examples helped." } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save response" }));

    expect(
      await screen.findByText(
        "Thanks. Your private response is saved, and you can revise it anytime.",
      ),
    ).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      "/api/practice/feedback",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          problemSlug: "sum-two-numbers",
          usefulness: "somewhat",
          comment: "The examples helped.",
        }),
      }),
    );
    expect(capturePracticeFeedbackSubmitted).toHaveBeenLastCalledWith(
      "somewhat",
    );

    fireEvent.click(screen.getByLabelText("Very useful"));
    fireEvent.change(
      screen.getByPlaceholderText(
        "One detail about the problem, checks, or next step",
      ),
      { target: { value: "The next-step link helped too." } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Update response" }));

    await waitFor(() =>
      expect(capturePracticeFeedbackSubmitted).toHaveBeenLastCalledWith("very"),
    );
    expect(JSON.stringify(capturePracticeFeedbackSubmitted.mock.calls)).not.toMatch(
      /examples helped|next-step link|function solve|email/i,
    );
  });
});

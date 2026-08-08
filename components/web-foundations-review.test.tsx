import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WEB_FOUNDATIONS_REVIEW_ITEMS } from "@/lib/web-foundations-review";
import { WebFoundationsReview } from "./web-foundations-review";

describe("WebFoundationsReview", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("teaches after each choice and saves only the bounded result", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          correctCount: 3,
          totalCount: 4,
          completedAt: "2026-08-07T12:00:00.000Z",
          nextDueAt: "2026-08-14T12:00:00.000Z",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    render(<WebFoundationsReview initialResult={null} />);

    for (const [index, item] of WEB_FOUNDATIONS_REVIEW_ITEMS.entries()) {
      const choice =
        index === 0
          ? item.options.find((option) => option.id !== item.correctOptionId)!
          : item.options.find((option) => option.id === item.correctOptionId)!;
      fireEvent.click(screen.getByLabelText(choice.label));
      fireEvent.click(screen.getByRole("button", { name: "Check my recall" }));
      if (index === 0) {
        expect(screen.getByText("One more pass")).toBeInTheDocument();
        expect(screen.getByText(item.recoveryCue)).toBeInTheDocument();
      }
      fireEvent.click(
        screen.getByRole("button", {
          name: index === 3 ? "Finish and save" : "Next concept",
        }),
      );
    }

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: "Your next foundations review is set for Aug 14.",
        }),
      ).toBeInTheDocument(),
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/courses/web-development-foundations/review",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ correctCount: 3, totalCount: 4 }),
      },
    );
    expect(fetchSpy.mock.calls[0]?.[1]?.body).not.toContain("option");
    expect(
      screen.getByRole("link", { name: "Continue the field guide" }),
    ).toHaveAttribute("href", "/projects/semantic-html-article");
  });

  it("keeps completion hidden and retryable after a failed save", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Review result could not be saved" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      }),
    );
    render(<WebFoundationsReview initialResult={null} />);

    for (const [index, item] of WEB_FOUNDATIONS_REVIEW_ITEMS.entries()) {
      const choice = item.options.find((option) => option.id === item.correctOptionId)!;
      fireEvent.click(screen.getByLabelText(choice.label));
      fireEvent.click(screen.getByRole("button", { name: "Check my recall" }));
      fireEvent.click(
        screen.getByRole("button", {
          name: index === 3 ? "Finish and save" : "Next concept",
        }),
      );
    }

    await waitFor(() =>
      expect(screen.getByText("Review result could not be saved")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Private lesson review saved")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry saving result" })).toBeInTheDocument();
  });
});

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WEB_FOUNDATIONS_REVIEW_ITEMS } from "@/lib/web-foundations-review";
import { WebFoundationsReview } from "./web-foundations-review";

const continuation = {
  href: "/practice/array-sum",
  label: "Solve problem 03",
};

describe("WebFoundationsReview", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
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
    render(
      <WebFoundationsReview
        continuation={continuation}
        initialResult={null}
        studentScope="student-one"
      />,
    );

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
    await waitFor(() => expect(window.localStorage.length).toBe(0));
    expect(
      screen.getByRole("link", { name: "Solve problem 03" }),
    ).toHaveAttribute("href", "/practice/array-sum");
  });

  it("keeps completion hidden and retryable after a failed save", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Review result could not be saved" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      }),
    );
    render(
      <WebFoundationsReview
        continuation={continuation}
        initialResult={null}
        studentScope="student-one"
      />,
    );

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

  it("recovers the exact unfinished lesson review after reload", async () => {
    const { unmount } = render(
      <WebFoundationsReview
        continuation={continuation}
        initialResult={null}
        studentScope="student-one"
      />,
    );
    const firstItem = WEB_FOUNDATIONS_REVIEW_ITEMS[0];
    const secondItem = WEB_FOUNDATIONS_REVIEW_ITEMS[1];
    const firstCorrectChoice = firstItem.options.find(
      (option) => option.id === firstItem.correctOptionId,
    )!;
    const secondWrongChoice = secondItem.options.find(
      (option) => option.id !== secondItem.correctOptionId,
    )!;

    fireEvent.click(screen.getByLabelText(firstCorrectChoice.label));
    fireEvent.click(screen.getByRole("button", { name: "Check my recall" }));
    fireEvent.click(screen.getByRole("button", { name: "Next concept" }));
    fireEvent.click(screen.getByLabelText(secondWrongChoice.label));
    fireEvent.click(screen.getByRole("button", { name: "Check my recall" }));

    await waitFor(() => expect(window.localStorage.length).toBe(1));
    unmount();

    render(
      <WebFoundationsReview
        continuation={continuation}
        initialResult={null}
        studentScope="student-one"
      />,
    );

    expect(
      await screen.findByText("Recovered your unfinished review in this browser."),
    ).toBeInTheDocument();
    expect(screen.getByText("Concept 2 of 4")).toBeInTheDocument();
    expect(screen.getByText("One more pass")).toBeInTheDocument();
    expect(screen.getByLabelText(secondWrongChoice.label)).toBeChecked();
  });
});

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProblemBookmarkButton } from "./problem-bookmark-button";

describe("ProblemBookmarkButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(cleanup);

  it("saves a problem privately for later", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ bookmark: { bookmarked: true } }), {
        status: 200,
      }),
    );

    render(
      <ProblemBookmarkButton
        initialBookmarked={false}
        problemSlug="sum-two-numbers"
        problemTitle="Sum two numbers"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save Sum two numbers for later" }));

    expect(await screen.findByText("Saved privately to your account.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Sum two numbers from saved problems" })).toHaveAttribute("aria-pressed", "true");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/practice/sum-two-numbers/bookmark",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ bookmarked: true }),
      }),
    );
  });

  it("removes a previously saved problem", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ bookmark: { bookmarked: false } }), {
        status: 200,
      }),
    );

    render(
      <ProblemBookmarkButton
        initialBookmarked
        problemSlug="sum-two-numbers"
        problemTitle="Sum two numbers"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove Sum two numbers from saved problems" }));

    expect(await screen.findByText("Removed from your saved problems.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Sum two numbers for later" })).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps the current state when saving fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));

    render(
      <ProblemBookmarkButton
        initialBookmarked={false}
        problemSlug="sum-two-numbers"
        problemTitle="Sum two numbers"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save Sum two numbers for later" }));

    expect(await screen.findByText("Couldn’t update saved problems. Try again.")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save Sum two numbers for later" })).toHaveAttribute("aria-pressed", "false"),
    );
  });
});

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CodingPracticeGoal } from "./coding-practice-goal";

const goal = {
  targetActiveDays: 3 as const,
  currentActiveDays: 2,
  weekStart: "2026-08-03",
  weekEnd: "2026-08-09",
};

describe("CodingPracticeGoal", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows one weekly active-day target without changing judged mastery", () => {
    render(<CodingPracticeGoal goal={goal} />);

    expect(
      screen.getByRole("heading", { name: "1 practice day to go." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Weekly active-day progress" }),
    ).toHaveAttribute("aria-valuenow", "2");
    expect(screen.getByRole("radio", { name: "3 days" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Update target" })).toBeDisabled();
    expect(screen.queryByText(/rank|rating|mastery/i)).not.toBeInTheDocument();
  });

  it("updates the visible target only after a confirmed private save", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ targetActiveDays: 5 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<CodingPracticeGoal goal={goal} />);

    fireEvent.click(screen.getByRole("radio", { name: "5 days" }));
    fireEvent.click(screen.getByRole("button", { name: "Update target" }));

    await waitFor(() =>
      expect(screen.getByText(/Saved privately: 5 active days/)).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/practice/goal",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ targetActiveDays: 5 }),
      }),
    );
    expect(
      screen.getByRole("heading", { name: "3 practice days to go." }),
    ).toBeInTheDocument();
  });

  it("keeps the previous target truthful after a failed save", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 500 })),
    );
    render(<CodingPracticeGoal goal={goal} />);

    fireEvent.click(screen.getByRole("radio", { name: "5 days" }));
    fireEvent.click(screen.getByRole("button", { name: "Update target" }));

    await waitFor(() =>
      expect(screen.getByText("Your target was not saved. Try again.")).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("heading", { name: "1 practice day to go." }),
    ).toBeInTheDocument();
  });

  it("keeps a newer target choice visibly unsaved when an older save returns", async () => {
    let finishFirstSave: ((response: Response) => void) | undefined;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            finishFirstSave = resolve;
          }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ targetActiveDays: 1 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<CodingPracticeGoal goal={goal} />);

    fireEvent.click(screen.getByRole("radio", { name: "5 days" }));
    fireEvent.click(screen.getByRole("button", { name: "Update target" }));
    fireEvent.click(screen.getByRole("radio", { name: "1 day" }));

    finishFirstSave?.(
      new Response(JSON.stringify({ targetActiveDays: 5 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    expect(
      await screen.findByText(
        "Your earlier 5-day target is saved. Your newer 1-day choice is still unsaved.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "1 day" })).toBeChecked();
    expect(
      screen.getByRole("heading", { name: "3 practice days to go." }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Update target" }));

    await waitFor(() =>
      expect(screen.getByText(/Saved privately: 1 active day/)).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/practice/goal",
      expect.objectContaining({
        body: JSON.stringify({ targetActiveDays: 1 }),
      }),
    );
  });
});

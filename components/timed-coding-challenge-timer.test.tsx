import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TimedCodingChallengeTimer } from "./timed-coding-challenge-timer";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("TimedCodingChallengeTimer", () => {
  function hydrateTimer() {
    act(() => {
      vi.advanceTimersByTime(0);
    });
  }

  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-05T12:00:00.000Z"));
    vi.stubGlobal("fetch", vi.fn());
    refresh.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("waits for the learner before starting the 30-minute countdown", () => {
    render(<TimedCodingChallengeTimer />);
    hydrateTimer();

    expect(screen.getByRole("timer")).toHaveTextContent("30:00");
    expect(screen.getByRole("heading", { name: "Timer ready" })).toBeVisible();
    expect(
      screen.getByText(
        "Start when you are ready. The countdown does not begin on page load.",
      ),
    ).toBeVisible();
  });

  it("pauses and restores the remaining browser-only time", () => {
    const firstView = render(<TimedCodingChallengeTimer />);
    hydrateTimer();
    fireEvent.click(screen.getByRole("button", { name: "Start 30-minute timer" }));

    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("28:59");

    fireEvent.click(screen.getByRole("button", { name: "Pause timer" }));
    expect(screen.getByRole("heading", { name: "Timer paused" })).toBeVisible();

    firstView.unmount();
    render(<TimedCodingChallengeTimer />);
    hydrateTimer();

    expect(screen.getByRole("timer")).toHaveTextContent("28:59");
    expect(screen.getByRole("button", { name: "Resume timer" })).toBeVisible();
  });

  it("expires without closing practice or changing saved records", () => {
    render(<TimedCodingChallengeTimer />);
    hydrateTimer();
    fireEvent.click(screen.getByRole("button", { name: "Start 30-minute timer" }));

    act(() => {
      vi.advanceTimersByTime(30 * 60 * 1_000);
    });

    expect(screen.getByRole("timer")).toHaveTextContent("00:00");
    expect(screen.getByRole("heading", { name: "Time is up" })).toBeVisible();
    expect(
      screen.getByText("The practice window ended, but every problem stays open."),
    ).toBeVisible();
  });

  it("keeps a separate browser-only deadline for each timed set", () => {
    const firstSet = render(
      <TimedCodingChallengeTimer challengeSetId="collections" />,
    );
    hydrateTimer();
    fireEvent.click(screen.getByRole("button", { name: "Start 30-minute timer" }));

    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    fireEvent.click(screen.getByRole("button", { name: "Pause timer" }));
    expect(screen.getByRole("timer")).toHaveTextContent("28:59");

    firstSet.unmount();
    render(<TimedCodingChallengeTimer challengeSetId="search-and-windows" />);
    hydrateTimer();

    expect(screen.getByRole("timer")).toHaveTextContent("30:00");
    expect(screen.getByRole("heading", { name: "Timer ready" })).toBeVisible();
  });

  it("saves a bounded elapsed time only after explicit finish", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 200 }));
    render(<TimedCodingChallengeTimer challengeSetId="collections" />);
    hydrateTimer();

    expect(
      screen.queryByRole("button", { name: "Finish and save result" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start 30-minute timer" }));
    act(() => {
      vi.advanceTimersByTime(61_000);
    });

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Finish and save result" }),
      );
    });

    expect(fetch).toHaveBeenCalledWith("/api/practice/challenge/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengeSetId: "collections",
        elapsedSeconds: 61,
      }),
    });
    expect(
      screen.getByText("Timed result saved privately to your account."),
    ).toBeVisible();
    expect(screen.getByRole("timer")).toHaveTextContent("30:00");
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("keeps a failed result paused and immediately retryable", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 500 }));
    render(<TimedCodingChallengeTimer challengeSetId="core-path" />);
    hydrateTimer();
    fireEvent.click(screen.getByRole("button", { name: "Start 30-minute timer" }));

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Finish and save result" }),
      );
    });

    expect(screen.getByRole("heading", { name: "Timer paused" })).toBeVisible();
    expect(
      screen.getByText(
        "Couldn’t save this result. Your timer is paused; try again.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Retry result save" }),
    ).toBeVisible();
    expect(refresh).not.toHaveBeenCalled();
  });
});

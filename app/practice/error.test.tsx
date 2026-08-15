import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PracticeError from "./error";

afterEach(cleanup);

describe("PracticeError", () => {
  it("retries the failed practice route without moving the learner", () => {
    const reset = vi.fn();

    render(<PracticeError reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("offers a safe secondary return to the practice catalog", () => {
    render(<PracticeError reset={() => undefined} />);

    expect(
      screen.getByRole("heading", {
        name: "We couldn’t load this practice space.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to practice" }),
    ).toHaveAttribute("href", "/practice");
  });
});

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SearchMethodExplorer } from "./search-method-explorer";

describe("SearchMethodExplorer", () => {
  afterEach(cleanup);

  it("opens a browser-only linear search walkthrough", () => {
    render(<SearchMethodExplorer />);

    fireEvent.click(screen.getByRole("button", { name: "Compare searches" }));

    expect(
      screen.getByRole("dialog", { name: "Watch the search space shrink." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Comparison 1 of 4")).toBeInTheDocument();
    expect(screen.getByText(/2 is not the target/)).toBeInTheDocument();
    expect(screen.getByText(/changes no saved code/)).toBeInTheDocument();
  });

  it("steps through linear search until the target is found", () => {
    render(<SearchMethodExplorer />);
    fireEvent.click(screen.getByRole("button", { name: "Compare searches" }));

    const nextButton = screen.getByRole("button", { name: /Next comparison/ });
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    expect(screen.getByText("Comparison 4 of 4")).toBeInTheDocument();
    expect(screen.getByText("13 matches the target at index 3.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Run again/ })).toBeInTheDocument();
  });

  it("shows binary search discarding half the list before finding the target", () => {
    render(<SearchMethodExplorer />);
    fireEvent.click(screen.getByRole("button", { name: "Compare searches" }));
    fireEvent.click(screen.getByRole("button", { name: /Binary search/ }));

    expect(screen.getByText("Comparison 1 of 2")).toBeInTheDocument();
    expect(screen.getByText(/Discard it and every value to its left/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Next comparison/ }));

    expect(screen.getByText("Comparison 2 of 2")).toBeInTheDocument();
    expect(screen.getByText("13 matches the target at index 3.")).toBeInTheDocument();
  });

  it("closes with Escape and returns focus to the trigger", () => {
    render(<SearchMethodExplorer />);
    const trigger = screen.getByRole("button", { name: "Compare searches" });
    fireEvent.click(trigger);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Compare searches" }),
    ).toHaveFocus();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JavaScriptMixedReview } from "./javascript-mixed-review";
import type { JavaScriptMixedReviewItem } from "@/lib/javascript-mixed-review";

const items: JavaScriptMixedReviewItem[] = [
  {
    id: "one",
    labSlug: "foundations",
    labTitle: "JavaScript foundations",
    concept: "Input",
    exerciseTitle: "Read tokens",
    scenario: "A program receives two values on one line.",
    recoveryCue: "Trace the tokens before converting them.",
    takeaway: "Split the input before converting values.",
    correctOptionId: "foundations",
    options: [
      { id: "foundations", label: "Split the input before converting values." },
      { id: "tracing", label: "Track each value after every statement." },
      { id: "debugging", label: "Isolate the first failing assumption." },
    ],
  },
  {
    id: "two",
    labSlug: "tracing",
    labTitle: "Code tracing",
    concept: "State",
    exerciseTitle: "Trace changes",
    scenario: "A variable changes inside a loop.",
    recoveryCue: "Write the value after each iteration.",
    takeaway: "Track each value after every statement.",
    correctOptionId: "tracing",
    options: [
      { id: "tracing", label: "Track each value after every statement." },
      { id: "debugging", label: "Isolate the first failing assumption." },
      { id: "foundations", label: "Split the input before converting values." },
    ],
  },
  {
    id: "three",
    labSlug: "debugging",
    labTitle: "Debugging",
    concept: "Diagnosis",
    exerciseTitle: "Find the fault",
    scenario: "A result is wrong for one edge case.",
    recoveryCue: "Compare the first unexpected state.",
    takeaway: "Isolate the first failing assumption.",
    correctOptionId: "debugging",
    options: [
      { id: "debugging", label: "Isolate the first failing assumption." },
      { id: "foundations", label: "Split the input before converting values." },
      { id: "tracing", label: "Track each value after every statement." },
    ],
  },
];

describe("JavaScriptMixedReview", () => {
  it("gives bounded recovery and completes without saving", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<JavaScriptMixedReview items={items} />);

    fireEvent.click(
      screen.getByLabelText("Track each value after every statement."),
    );
    fireEvent.click(screen.getByRole("button", { name: "Check my recall" }));

    expect(screen.getByText("One more pass")).toBeInTheDocument();
    expect(
      screen.getByText("Trace the tokens before converting them."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next concept" }));
    fireEvent.click(
      screen.getByLabelText("Track each value after every statement."),
    );
    fireEvent.click(screen.getByRole("button", { name: "Check my recall" }));
    fireEvent.click(screen.getByRole("button", { name: "Next concept" }));
    fireEvent.click(
      screen.getByLabelText("Isolate the first failing assumption."),
    );
    fireEvent.click(screen.getByRole("button", { name: "Check my recall" }));
    fireEvent.click(screen.getByRole("button", { name: "Finish review" }));

    expect(
      screen.getByRole("heading", {
        name: "You brought 3 completed concepts back to mind.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("2 of 3 concepts recalled")).toBeInTheDocument();
    expect(screen.getByText(/No answers or score were added/)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

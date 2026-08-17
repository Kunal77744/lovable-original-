import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("gives bounded recovery and saves only the final result", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          correctCount: 2,
          totalCount: 3,
          completedAt: "2026-08-07T12:00:00.000Z",
          nextDueAt: "2026-08-10T12:00:00.000Z",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    render(
      <JavaScriptMixedReview
        initialResult={null}
        items={items}
        nextHref="/practice/test-design?exercise=1"
        nextLabel="Continue Test design, exercise 1"
        studentScope="student-one"
      />,
    );

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
    fireEvent.click(screen.getByRole("button", { name: "Finish and save" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: "Your next mixed review is set for Aug 10.",
        }),
      ).toBeInTheDocument(),
    );
    expect(fetchSpy).toHaveBeenCalledWith("/api/practice/mixed-review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ correctCount: 2, totalCount: 3 }),
    });
    expect(fetchSpy.mock.calls[0]?.[1]?.body).not.toContain("option");
    await waitFor(() => expect(window.localStorage.length).toBe(0));
    expect(
      screen.getByRole("link", {
        name: "Continue Test design, exercise 1",
      }),
    ).toHaveAttribute("href", "/practice/test-design?exercise=1");
  });

  it("keeps completion hidden when the private save fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Review result could not be saved" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      }),
    );
    render(
      <JavaScriptMixedReview
        initialResult={null}
        items={items}
        nextHref="/practice"
        nextLabel="Return to JavaScript practice"
        studentScope="student-one"
      />,
    );

    for (const [index, label] of [
      "Split the input before converting values.",
      "Track each value after every statement.",
      "Isolate the first failing assumption.",
    ].entries()) {
      fireEvent.click(screen.getByLabelText(label));
      fireEvent.click(screen.getByRole("button", { name: "Check my recall" }));
      fireEvent.click(
        screen.getByRole("button", {
          name: index === 2 ? "Finish and save" : "Next concept",
        }),
      );
    }

    await waitFor(() =>
      expect(
        screen.getByText("Review result could not be saved"),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByText("Private review saved"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Retry saving result" }),
    ).toBeInTheDocument();
  });

  it("recovers an unfinished account-scoped review after reload", async () => {
    const { unmount } = render(
      <JavaScriptMixedReview
        initialResult={null}
        items={items}
        nextHref="/practice"
        nextLabel="Return to JavaScript practice"
        studentScope="student-one"
      />,
    );

    fireEvent.click(
      screen.getByLabelText("Split the input before converting values."),
    );
    fireEvent.click(screen.getByRole("button", { name: "Check my recall" }));
    fireEvent.click(screen.getByRole("button", { name: "Next concept" }));
    fireEvent.click(
      screen.getByLabelText("Track each value after every statement."),
    );
    fireEvent.click(screen.getByRole("button", { name: "Check my recall" }));

    await waitFor(() => expect(window.localStorage.length).toBe(1));
    unmount();

    render(
      <JavaScriptMixedReview
        initialResult={null}
        items={items}
        nextHref="/practice"
        nextLabel="Return to JavaScript practice"
        studentScope="student-one"
      />,
    );

    expect(
      await screen.findByText("Recovered your unfinished review in this browser."),
    ).toBeInTheDocument();
    expect(screen.getByText("Concept 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Recalled")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Track each value after every statement."),
    ).toBeChecked();
  });

  it("does not expose one account's unfinished review to another", async () => {
    const firstRender = render(
      <JavaScriptMixedReview
        initialResult={null}
        items={items}
        nextHref="/practice"
        nextLabel="Return to JavaScript practice"
        studentScope="student-one"
      />,
    );
    fireEvent.click(
      screen.getByLabelText("Split the input before converting values."),
    );
    await waitFor(() => expect(window.localStorage.length).toBe(1));
    firstRender.unmount();

    render(
      <JavaScriptMixedReview
        initialResult={null}
        items={items}
        nextHref="/practice"
        nextLabel="Return to JavaScript practice"
        studentScope="student-two"
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Concept 1 of 3")).toBeInTheDocument(),
    );
    expect(
      screen.queryByText("Recovered your unfinished review in this browser."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("Split the input before converting values."),
    ).not.toBeChecked();
  });

  it("replays saved prompts without changing the private result or due date", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(
      <JavaScriptMixedReview
        initialResult={{
          correctCount: 2,
          totalCount: 3,
          completedAt: "2026-08-07T12:00:00.000Z",
          nextDueAt: "2026-08-10T12:00:00.000Z",
        }}
        items={items}
        nextHref="/practice/test-design?exercise=1"
        nextLabel="Continue Test design, exercise 1"
        studentScope="student-one"
      />,
    );

    expect(
      screen.getByRole("link", {
        name: "Continue Test design, exercise 1",
      }),
    ).toHaveAttribute("href", "/practice/test-design?exercise=1");

    fireEvent.click(
      screen.getByRole("button", { name: "Practice these prompts now" }),
    );

    for (const [index, label] of [
      "Split the input before converting values.",
      "Track each value after every statement.",
      "Isolate the first failing assumption.",
    ].entries()) {
      fireEvent.click(screen.getByLabelText(label));
      fireEvent.click(screen.getByRole("button", { name: "Check my recall" }));
      fireEvent.click(
        screen.getByRole("button", {
          name: index === 2 ? "Finish practice" : "Next concept",
        }),
      );
    }

    expect(
      screen.getByRole("heading", {
        name: "You recalled 3 of 3 concepts in this practice round.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your saved 2 of 3 result and Aug 10 review date did not change. This round stayed in this browser.",
      ),
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(window.localStorage.length).toBe(0);
    expect(
      screen.queryByText("Recovered your unfinished review in this browser."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Practice these prompts again" }),
    ).toBeInTheDocument();
  });
});

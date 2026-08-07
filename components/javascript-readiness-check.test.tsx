import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JavaScriptReadinessCheck } from "./javascript-readiness-check";
import { JAVASCRIPT_READINESS_QUESTIONS } from "@/lib/javascript-readiness";

const recommendationHrefs = [
  { labSlug: "foundations" as const, href: "/practice/foundations" },
  { labSlug: "tracing" as const, href: "/practice/tracing" },
  { labSlug: "debugging" as const, href: "/practice/debugging" },
  { labSlug: "test-design" as const, href: "/practice/test-design" },
  { labSlug: "data-structures" as const, href: "/practice/data-structures" },
  { labSlug: "functions" as const, href: "/practice/functions" },
  { labSlug: "algorithm-patterns" as const, href: "/practice/algorithm-patterns" },
];

describe("JavaScriptReadinessCheck", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("restores a private result and opens the exact recommended lab", () => {
    render(
      <JavaScriptReadinessCheck
        initialResult={{
          correctCount: 4,
          totalCount: 6,
          recommendedLabSlug: "tracing",
          completedAt: "2026-08-07T12:00:00.000Z",
        }}
        recommendationHrefs={recommendationHrefs}
      />,
    );

    expect(screen.getByText("Strengthen code tracing")).toBeInTheDocument();
    expect(screen.getByLabelText("4 of 6 checks passed")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open recommended lab" }),
    ).toHaveAttribute("href", "/practice/tracing");
    expect(screen.queryByText(/seven|function solve/i)).not.toBeInTheDocument();
  });

  it("sends six bounded choices and shows the saved recommendation", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          correctCount: 5,
          totalCount: 6,
          recommendedLabSlug: "tracing",
          completedAt: "2026-08-07T12:00:00.000Z",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    render(
      <JavaScriptReadinessCheck
        initialResult={null}
        recommendationHrefs={recommendationHrefs}
      />,
    );

    for (const [index, question] of JAVASCRIPT_READINESS_QUESTIONS.entries()) {
      const option = index === 1 ? question.options[0] : question.options.find(
        (candidate) => candidate.id === question.correctOptionId,
      );
      fireEvent.click(screen.getByLabelText(option!.label));
      fireEvent.click(
        screen.getByRole("button", {
          name: index === JAVASCRIPT_READINESS_QUESTIONS.length - 1
            ? "Save my result"
            : "Next concept",
        }),
      );
    }

    await waitFor(() => {
      expect(screen.getByText("Strengthen code tracing")).toBeInTheDocument();
    });
    const [, request] = vi.mocked(fetch).mock.calls[0];
    const payload = JSON.parse(String(request?.body));
    expect(payload.answers).toHaveLength(6);
    expect(Object.keys(payload.answers[0])).toEqual(["questionId", "optionId"]);
  });

  it("keeps choices available when saving fails", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 500 }));
    render(
      <JavaScriptReadinessCheck
        initialResult={null}
        recommendationHrefs={recommendationHrefs}
      />,
    );

    for (const [index, question] of JAVASCRIPT_READINESS_QUESTIONS.entries()) {
      const option = question.options.find(
        (candidate) => candidate.id === question.correctOptionId,
      )!;
      fireEvent.click(screen.getByLabelText(option.label));
      fireEvent.click(
        screen.getByRole("button", {
          name: index === JAVASCRIPT_READINESS_QUESTIONS.length - 1
            ? "Save my result"
            : "Next concept",
        }),
      );
    }

    expect(
      await screen.findByText(
        "Your result was not saved. Try again without losing your choices.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Inside that function's scope")).toBeChecked();
  });
});

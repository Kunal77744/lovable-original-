import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  EMPTY_INTERVIEW_DRILL_PROGRESS,
  JAVASCRIPT_INTERVIEW_DRILL,
  type InterviewDrillProgress,
} from "@/lib/interview-drill";
import { InterviewDrill } from "./interview-drill";

const startedProgress: InterviewDrillProgress = {
  status: "in-progress",
  currentQuestion: 0,
  answers: [],
  startedAt: "2026-07-27T01:00:00.000Z",
  completedAt: null,
  updatedAt: "2026-07-27T01:00:00.000Z",
};

describe("InterviewDrill", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("starts one bounded five-question round", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ progress: startedProgress }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <InterviewDrill initialProgress={EMPTY_INTERVIEW_DRILL_PROGRESS} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Start the drill" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: JAVASCRIPT_INTERVIEW_DRILL.questions[0].prompt,
        }),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/interview/javascript-fundamentals",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "start" }),
      }),
    );
  });

  it("saves the exact answer and advances after self-rating", async () => {
    const answer = "const prevents reassignment, but an object can still mutate.";
    const nextProgress: InterviewDrillProgress = {
      ...startedProgress,
      currentQuestion: 1,
      answers: [
        {
          questionSlug: "const-let-var",
          answer,
          rating: "ready",
        },
      ],
      updatedAt: "2026-07-27T01:02:00.000Z",
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ progress: nextProgress }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<InterviewDrill initialProgress={startedProgress} />);

    fireEvent.change(screen.getByRole("textbox", { name: /Your answer/ }), {
      target: { value: answer },
    });
    fireEvent.click(screen.getByLabelText("Ready to explain"));
    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: JAVASCRIPT_INTERVIEW_DRILL.questions[1].prompt,
        }),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/interview/javascript-fundamentals",
      expect.objectContaining({
        body: JSON.stringify({
          action: "save-answer",
          questionSlug: "const-let-var",
          answer,
          rating: "ready",
        }),
      }),
    );
    expect(screen.getByText("1/5 saved")).toBeInTheDocument();
  });

  it("restores the next unanswered question from saved account progress", () => {
    render(
      <InterviewDrill
        initialProgress={{
          ...startedProgress,
          currentQuestion: 2,
          answers: [
            {
              questionSlug: "const-let-var",
              answer: "const and let are block scoped.",
              rating: "almost",
            },
            {
              questionSlug: "strict-equality",
              answer: "Strict equality avoids coercion.",
              rating: "ready",
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: JAVASCRIPT_INTERVIEW_DRILL.questions[2].prompt,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("2/5 saved")).toBeInTheDocument();
  });

  it("shows a saved private result with one dashboard return path", () => {
    const answers = JAVASCRIPT_INTERVIEW_DRILL.questions.map(
      (question, index) => ({
        questionSlug: question.slug,
        answer: `Private answer ${index + 1}`,
        rating: index < 3 ? ("ready" as const) : ("needs-work" as const),
      }),
    );

    render(
      <InterviewDrill
        initialProgress={{
          status: "completed",
          currentQuestion: 4,
          answers,
          startedAt: "2026-07-27T01:00:00.000Z",
          completedAt: "2026-07-27T01:10:00.000Z",
          updatedAt: "2026-07-27T01:10:00.000Z",
        }}
      />,
    );

    expect(screen.getByText("3/5")).toBeInTheDocument();
    expect(
      screen.getByText(
        "You marked 3 of 5 ready to explain and 2 for another pass.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Private answer 1")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
  });
});

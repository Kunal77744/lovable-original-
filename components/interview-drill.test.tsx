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

function completedProgress(
  ratings: InterviewDrillProgress["answers"][number]["rating"][] = [
    "ready",
    "ready",
    "ready",
    "needs-work",
    "needs-work",
  ],
): InterviewDrillProgress {
  return {
    status: "completed",
    currentQuestion: 4,
    answers: JAVASCRIPT_INTERVIEW_DRILL.questions.map((question, index) => ({
      questionSlug: question.slug,
      answer: `Private answer ${index + 1}`,
      rating: ratings[index] ?? "ready",
    })),
    startedAt: "2026-07-27T01:00:00.000Z",
    completedAt: "2026-07-27T01:10:00.000Z",
    updatedAt: "2026-07-27T01:10:00.000Z",
  };
}

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

    expect(screen.getByText("5 questions remaining")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start the drill" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: JAVASCRIPT_INTERVIEW_DRILL.questions[0].prompt,
        }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Question 1 of 5")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/interview/javascript-fundamentals",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "start" }),
      }),
    );
    expect(screen.getByText("5 questions remaining")).toBeInTheDocument();
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
    expect(screen.getByText("Question 2 of 5")).toBeInTheDocument();
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
    expect(screen.getByText("4 questions remaining")).toBeInTheDocument();
  });

  it("announces saving and success through one atomic status region", async () => {
    const answer = "const prevents reassignment.";
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
    let resolveFetch:
      | ((value: {
          ok: boolean;
          json: () => Promise<{ progress: InterviewDrillProgress }>;
        }) => void)
      | undefined;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<InterviewDrill initialProgress={startedProgress} />);

    fireEvent.change(screen.getByRole("textbox", { name: /Your answer/ }), {
      target: { value: answer },
    });
    fireEvent.click(screen.getByLabelText("Ready to explain"));
    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }));

    const status = screen.getByRole("status");
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(status).toHaveTextContent("Saving your answer…");
    expect(screen.getByText("5 questions remaining")).toBeInTheDocument();

    resolveFetch?.({
      ok: true,
      json: async () => ({ progress: nextProgress }),
    });

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Answer saved. Next question.",
      ),
    );
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByText("4 questions remaining")).toBeInTheDocument();
  });

  it("locks the submitted answer and rating until the save finishes", async () => {
    const answer = "const prevents reassignment.";
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
    let resolveFetch:
      | ((value: {
          ok: boolean;
          json: () => Promise<{ progress: InterviewDrillProgress }>;
        }) => void)
      | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
      ),
    );

    render(<InterviewDrill initialProgress={startedProgress} />);

    const answerField = screen.getByRole("textbox", { name: /Your answer/ });
    const ratingField = screen.getByLabelText("Ready to explain");
    fireEvent.change(answerField, { target: { value: answer } });
    fireEvent.click(ratingField);
    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }));

    expect(answerField).toBeDisabled();
    screen.getAllByRole("radio").forEach((option) => {
      expect(option).toBeDisabled();
    });
    expect(answerField).toHaveValue(answer);
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();

    resolveFetch?.({
      ok: true,
      json: async () => ({ progress: nextProgress }),
    });

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: JAVASCRIPT_INTERVIEW_DRILL.questions[1].prompt,
        }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("textbox", { name: /Your answer/ }),
    ).not.toBeDisabled();
  });

  it("announces a failed save through the same status region", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Your answer wasn’t saved. Try again." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<InterviewDrill initialProgress={startedProgress} />);

    fireEvent.change(screen.getByRole("textbox", { name: /Your answer/ }), {
      target: { value: "const prevents reassignment." },
    });
    fireEvent.click(screen.getByLabelText("Ready to explain"));
    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Your answer wasn’t saved. Try again.",
      ),
    );
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByText("5 questions remaining")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Your answer/ })).toHaveValue(
      "const prevents reassignment.",
    );
    expect(screen.getByRole("textbox", { name: /Your answer/ })).toBeEnabled();
    expect(screen.getByLabelText("Ready to explain")).toBeChecked();
    expect(screen.getByLabelText("Ready to explain")).toBeEnabled();
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
    expect(screen.getByText("Question 3 of 5")).toBeInTheDocument();
    expect(screen.getByText("3 questions remaining")).toBeInTheDocument();
  });

  it("shows a private review action for every answer that is not ready", () => {
    render(
      <InterviewDrill
        initialProgress={completedProgress([
          "ready",
          "ready",
          "ready",
          "almost",
          "needs-work",
        ])}
      />,
    );

    expect(screen.getByText("3/5")).toBeInTheDocument();
    expect(screen.getByText("0 questions remaining")).toBeInTheDocument();
    expect(
      screen.getByText(
        "You marked 3 of 5 ready to explain and 2 for another pass.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Private answer 1")).toBeInTheDocument();
    JAVASCRIPT_INTERVIEW_DRILL.questions.forEach((_, index) => {
      expect(
        screen.getByText(`Question ${index + 1} of 5`),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("link", { name: "Return to dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
    expect(
      screen.getByRole("button", { name: "Review 2 answers" }),
    ).toBeInTheDocument();
  });

  it("loads the exact first saved answer and rating without creating a new drill", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <InterviewDrill
        initialProgress={completedProgress([
          "needs-work",
          "ready",
          "almost",
          "ready",
          "ready",
        ])}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Review 2 answers" }));

    expect(
      screen.getByRole("heading", {
        name: JAVASCRIPT_INTERVIEW_DRILL.questions[0].prompt,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Private answer review")).toBeInTheDocument();
    expect(screen.getByText("Review 1 of 2")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /Revise your saved answer/ }),
    ).toHaveValue("Private answer 1");
    expect(screen.getByLabelText("Needs another pass")).toBeChecked();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("updates the existing answer and continues with the next saved review item", async () => {
    const initialProgress = completedProgress([
      "needs-work",
      "ready",
      "almost",
      "ready",
      "ready",
    ]);
    const firstRevisedProgress: InterviewDrillProgress = {
      ...initialProgress,
      answers: initialProgress.answers.map((savedAnswer) =>
        savedAnswer.questionSlug === "const-let-var"
          ? {
              ...savedAnswer,
              answer: "Revised explanation of const, let, and var.",
              rating: "ready",
            }
          : savedAnswer,
      ),
      updatedAt: "2026-07-27T01:12:00.000Z",
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ progress: firstRevisedProgress }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<InterviewDrill initialProgress={initialProgress} />);
    fireEvent.click(screen.getByRole("button", { name: "Review 2 answers" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: /Revise your saved answer/ }),
      { target: { value: "Revised explanation of const, let, and var." } },
    );
    fireEvent.click(screen.getByLabelText("Ready to explain"));
    fireEvent.click(
      screen.getByRole("button", { name: "Save review and continue" }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: JAVASCRIPT_INTERVIEW_DRILL.questions[2].prompt,
        }),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/interview/javascript-fundamentals",
      expect.objectContaining({
        body: JSON.stringify({
          action: "save-answer",
          questionSlug: "const-let-var",
          answer: "Revised explanation of const, let, and var.",
          rating: "ready",
        }),
      }),
    );
    expect(screen.getByText("Review 2 of 2")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /Revise your saved answer/ }),
    ).toHaveValue("Private answer 3");
    expect(screen.getByLabelText("Nearly there")).toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Answer updated. Next review question.",
    );
  });

  it("clears the review action after the last answer becomes ready", async () => {
    const initialProgress = completedProgress([
      "ready",
      "ready",
      "ready",
      "ready",
      "needs-work",
    ]);
    const readyProgress: InterviewDrillProgress = {
      ...initialProgress,
      answers: initialProgress.answers.map((savedAnswer) => ({
        ...savedAnswer,
        rating: "ready" as const,
      })),
      updatedAt: "2026-07-27T01:12:00.000Z",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ progress: readyProgress }),
      }),
    );

    render(<InterviewDrill initialProgress={initialProgress} />);
    fireEvent.click(screen.getByRole("button", { name: "Review 1 answer" }));
    fireEvent.click(screen.getByLabelText("Ready to explain"));
    fireEvent.click(screen.getByRole("button", { name: "Save review" }));

    await waitFor(() =>
      expect(screen.getByText("5/5")).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /Review \d+ answer/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Review complete. All five answers are ready to explain.",
    );
  });

  it("keeps an answer in review until its saved rating becomes ready", async () => {
    const initialProgress = completedProgress([
      "ready",
      "ready",
      "ready",
      "ready",
      "almost",
    ]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ progress: initialProgress }),
      }),
    );

    render(<InterviewDrill initialProgress={initialProgress} />);
    fireEvent.click(screen.getByRole("button", { name: "Review 1 answer" }));
    fireEvent.click(screen.getByRole("button", { name: "Save review" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "1 answer still needs another pass.",
      ),
    );
    expect(screen.getByText("Private answer review")).toBeInTheDocument();
    expect(screen.getByText("Review 1 of 1")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /Revise your saved answer/ }),
    ).toHaveValue("Private answer 5");
    expect(screen.getByLabelText("Nearly there")).toBeChecked();
  });

  it("keeps the review action hidden when every saved answer is ready", () => {
    render(
      <InterviewDrill
        initialProgress={completedProgress([
          "ready",
          "ready",
          "ready",
          "ready",
          "ready",
        ])}
      />,
    );

    expect(screen.queryByRole("button", { name: /Review/ })).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
  });
});

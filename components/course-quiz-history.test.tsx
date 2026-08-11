import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CourseQuizAttempt } from "@/db/course";
import { CourseQuizHistory } from "./course-quiz-history";

afterEach(cleanup);

const attempts: CourseQuizAttempt[] = [
  {
    id: "attempt-3",
    lessonSlug: "css-selectors-box-model",
    lessonTitle: "Style a card without guessing",
    lessonModuleTitle: "Module 2 · CSS foundations",
    lessonPosition: 2,
    score: 75,
    correctCount: 3,
    totalCount: 4,
    passed: true,
    createdAt: "2026-08-11T10:45:00.000Z",
  },
  {
    id: "attempt-2",
    lessonSlug: "semantic-html",
    lessonTitle: "Build a page the browser understands",
    lessonModuleTitle: "Module 1 · HTML foundations",
    lessonPosition: 1,
    score: 100,
    correctCount: 4,
    totalCount: 4,
    passed: true,
    createdAt: "2026-08-10T09:30:00.000Z",
  },
  {
    id: "attempt-1",
    lessonSlug: "semantic-html",
    lessonTitle: "Build a page the browser understands",
    lessonModuleTitle: "Module 1 · HTML foundations",
    lessonPosition: 1,
    score: 50,
    correctCount: 2,
    totalCount: 4,
    passed: false,
    createdAt: "2026-08-09T08:15:00.000Z",
  },
];

describe("CourseQuizHistory", () => {
  it("groups owned attempts by lesson and shows truthful outcomes", () => {
    render(<CourseQuizHistory attempts={attempts} />);

    expect(
      screen.getByRole("heading", {
        name: "See the work behind your best score.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Quiz history summary")).toHaveTextContent(
      "3Saved attempts2Passing results2/3Lessons attempted",
    );

    const htmlLesson = screen
      .getByRole("heading", { name: "Build a page the browser understands" })
      .closest("article");
    expect(htmlLesson).not.toBeNull();
    expect(within(htmlLesson!).getByText("Best").parentElement).toHaveTextContent(
      "Best100%",
    );
    expect(within(htmlLesson!).getByText("Keep practicing")).toBeInTheDocument();
    expect(within(htmlLesson!).getByText("2/4 checks")).toBeInTheDocument();
    expect(within(htmlLesson!).getByText(/Aug 10, 2026/)).toBeInTheDocument();
    expect(
      within(htmlLesson!).getByRole("link", { name: /Reopen this lesson/ }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/semantic-html#knowledge-check",
    );
  });

  it("keeps private answer content and identity out of the record", () => {
    const { container } = render(<CourseQuizHistory attempts={attempts} />);

    expect(container).toHaveTextContent("Scores, not answers.");
    expect(container).not.toHaveTextContent("correctChoiceId");
    expect(container).not.toHaveTextContent("private@example.com");
  });

  it("gives an empty learner one exact first quiz action", () => {
    render(<CourseQuizHistory attempts={[]} />);

    expect(
      screen.getByRole("heading", {
        name: "Your first result will build this record.",
      }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("Quiz history summary")).getByText(
        (_, element) => element?.textContent === "0/3",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Start the first quiz/ }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/semantic-html#knowledge-check",
    );
  });
});

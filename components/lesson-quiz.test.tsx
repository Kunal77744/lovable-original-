import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LessonQuiz } from "./lesson-quiz";

const captureLearnerEventOnce = vi.hoisted(() => vi.fn());
const captureLessonCompleted = vi.hoisted(() => vi.fn());

vi.mock("@/lib/product-analytics", () => ({
  captureLearnerEventOnce,
  captureLessonCompleted,
}));

const questions = [
  {
    id: "q1",
    prompt: "First question",
    choices: [
      { id: "a", label: "First answer" },
      { id: "b", label: "Second answer" },
    ],
  },
  {
    id: "q2",
    prompt: "Second question",
    choices: [
      { id: "a", label: "Third answer" },
      { id: "b", label: "Fourth answer" },
    ],
  },
] as const;

describe("LessonQuiz analytics", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          score: 100,
          correctCount: 2,
          totalCount: 2,
          passed: true,
          completed: true,
          savedScore: 100,
          review: [
            {
              questionId: "q1",
              correct: true,
              explanation: "The first concept is working.",
            },
            {
              questionId: "q2",
              correct: true,
              explanation: "The second concept is working.",
            },
          ],
        }),
      }),
    );
  });

  it("restores exact unfinished choices for the signed-in learner", async () => {
    const storageKey =
      "lovable-original:private-lesson-quiz:v1:student-1:web-development-foundations:semantic-html";
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: 1,
        questionSignature: JSON.stringify(
          questions.map((question) => ({
            id: question.id,
            choiceIds: question.choices.map((choice) => choice.id),
          })),
        ),
        answers: { q1: "b" },
      }),
    );

    render(
      <LessonQuiz
        courseTitle="Web Development Foundations"
        courseLessonCount={3}
        completesCourse={false}
        courseSlug="web-development-foundations"
        lessonSlug="semantic-html"
        questions={questions}
        passPercent={75}
        initialCompleted={false}
        initialScore={null}
        initialFeedback={null}
        studentScope="student-1"
      />,
    );

    await waitFor(() =>
      expect(screen.getByLabelText("Second answer")).toBeChecked(),
    );
    expect(screen.getByLabelText("Third answer")).not.toBeChecked();
    expect(
      screen.getByText(
        "Recovered your unfinished quiz choices in this browser.",
      ),
    ).toBeInTheDocument();
  });

  it.each([
    [
      "a stale question set",
      {
        version: 1,
        questionSignature: "old-question-set",
        answers: { q1: "a" },
      },
    ],
    [
      "a malformed choice",
      {
        version: 1,
        questionSignature: JSON.stringify(
          questions.map((question) => ({
            id: question.id,
            choiceIds: question.choices.map((choice) => choice.id),
          })),
        ),
        answers: { q1: "not-an-authored-choice" },
      },
    ],
  ])("rejects %s from browser recovery", async (_label, storedProgress) => {
    const storageKey =
      "lovable-original:private-lesson-quiz:v1:student-1:web-development-foundations:semantic-html";
    window.localStorage.setItem(storageKey, JSON.stringify(storedProgress));

    render(
      <LessonQuiz
        courseTitle="Web Development Foundations"
        courseLessonCount={3}
        completesCourse={false}
        courseSlug="web-development-foundations"
        lessonSlug="semantic-html"
        questions={questions}
        passPercent={75}
        initialCompleted={false}
        initialScore={null}
        initialFeedback={null}
        studentScope="student-1"
      />,
    );

    await waitFor(() =>
      expect(window.localStorage.getItem(storageKey)).toBeNull(),
    );
    expect(screen.getByLabelText("First answer")).not.toBeChecked();
    expect(
      screen.queryByText(
        "Recovered your unfinished quiz choices in this browser.",
      ),
    ).not.toBeInTheDocument();
  });

  it("captures quiz completion after the result is saved without quiz content", async () => {
    render(
      <LessonQuiz
        courseTitle="Web Development Foundations"
        courseLessonCount={1}
        completesCourse
        courseSlug="web-development-foundations"
        lessonSlug="semantic-html"
        questions={questions}
        passPercent={75}
        initialCompleted={false}
        initialScore={null}
        initialFeedback={null}
        studentScope="student-1"
      />,
    );

    fireEvent.click(screen.getByLabelText("First answer"));
    fireEvent.click(screen.getByLabelText("Third answer"));
    fireEvent.click(screen.getByRole("button", { name: "Check my answers" }));

    await waitFor(() =>
      expect(captureLearnerEventOnce).toHaveBeenCalledWith("quiz_completed", {
        course_slug: "web-development-foundations",
        lesson_slug: "semantic-html",
        passed: true,
      }),
    );
    expect(captureLessonCompleted).toHaveBeenCalledOnce();
    expect(captureLessonCompleted).toHaveBeenCalledWith({
      courseSlug: "web-development-foundations",
      completionState: "completed",
    });

    expect(
      JSON.stringify([
        captureLearnerEventOnce.mock.calls,
        captureLessonCompleted.mock.calls,
      ]),
    ).not.toMatch(
      /First question|First answer|q1/i,
    );
    expect(
      screen.getByRole("heading", {
        name: "You completed Web Development Foundations.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Turn the score into a next attempt.",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Confirmed")).toHaveLength(2);
    expect(screen.getByText("The first concept is working.")).toBeInTheDocument();
    expect(screen.getByText(/1 of 1 lesson complete/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start revision" }),
    ).toHaveAttribute("href", "#revision-pack");
    expect(
      screen.getByRole("link", { name: "Review quiz attempts" }),
    ).toHaveAttribute(
      "href",
      "/courses/web-development-foundations/quiz-history",
    );
    expect(
      screen.getByRole("heading", { name: "Semantic HTML, compressed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "How the structure connects" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Continue to JavaScript practice",
      }),
    ).toHaveAttribute("href", "/practice");
    expect(
      window.localStorage.getItem(
        "lovable-original:private-lesson-quiz:v1:student-1:web-development-foundations:semantic-html",
      ),
    ).toBeNull();
  });

  it("keeps unfinished choices recoverable when grading does not save", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "The result could not be saved." }),
      }),
    );

    const storageKey =
      "lovable-original:private-lesson-quiz:v1:student-1:web-development-foundations:semantic-html";
    render(
      <LessonQuiz
        courseTitle="Web Development Foundations"
        courseLessonCount={3}
        completesCourse={false}
        courseSlug="web-development-foundations"
        lessonSlug="semantic-html"
        questions={questions}
        passPercent={75}
        initialCompleted={false}
        initialScore={null}
        initialFeedback={null}
        studentScope="student-1"
      />,
    );

    fireEvent.click(screen.getByLabelText("First answer"));
    fireEvent.click(screen.getByLabelText("Third answer"));
    await waitFor(() =>
      expect(window.localStorage.getItem(storageKey)).not.toBeNull(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Check my answers" }));

    expect(
      await screen.findByText("The result could not be saved."),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(storageKey)).not.toBeNull();
  });

  it("shows the concept map when a saved completion is restored", () => {
    render(
      <LessonQuiz
        courseTitle="Web Development Foundations"
        courseLessonCount={1}
        completesCourse
        courseSlug="web-development-foundations"
        lessonSlug="semantic-html"
        questions={questions}
        passPercent={75}
        initialCompleted
        initialScore={100}
        initialFeedback={null}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "You completed Web Development Foundations.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "How the structure connects" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to your article" }),
    ).toHaveAttribute("href", "#semantic-workspace");
    expect(
      screen.getByRole("link", {
        name: "Continue to JavaScript practice",
      }),
    ).toHaveAttribute("href", "/practice");
  });

  it("keeps practice hidden when another course lesson remains", async () => {
    render(
      <LessonQuiz
        courseTitle="Web Development Foundations"
        courseLessonCount={2}
        completesCourse={false}
        courseSlug="web-development-foundations"
        lessonSlug="semantic-html"
        questions={questions}
        passPercent={75}
        initialCompleted={false}
        initialScore={null}
        initialFeedback={null}
        completedLessonsAfterPass={1}
        nextLesson={{
          title: "Style a card without guessing",
          href: "/learn/web-development-foundations/css-selectors-box-model",
        }}
      />,
    );

    fireEvent.click(screen.getByLabelText("First answer"));
    fireEvent.click(screen.getByLabelText("Third answer"));
    fireEvent.click(screen.getByRole("button", { name: "Check my answers" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "You built the foundation." }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("link", {
        name: "Continue to JavaScript practice",
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/1 of 2 lessons complete/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Continue to Style a card without guessing",
      }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/css-selectors-box-model",
    );
  });

  it("keeps signed-out answers local until the learner requests grading", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LessonQuiz
        courseTitle="Web Development Foundations"
        courseLessonCount={1}
        completesCourse={false}
        courseSlug="web-development-foundations"
        lessonSlug="semantic-html"
        questions={questions}
        passPercent={75}
        initialCompleted={false}
        initialScore={null}
        initialFeedback={null}
        isSignedIn={false}
      />,
    );

    expect(
      screen.queryByRole("link", { name: "Create account" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("First answer"));
    fireEvent.click(screen.getByLabelText("Third answer"));
    fireEvent.click(screen.getByRole("button", { name: "Check my answers" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/create a free account to check your answers/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute(
      "href",
      "/account",
    );
    expect(
      screen.queryByRole("heading", {
        name: "Turn the score into a next attempt.",
      }),
    ).not.toBeInTheDocument();
  });

  it("teaches after a saved failed attempt and clears stale review on revision", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          score: 50,
          correctCount: 1,
          totalCount: 2,
          passed: false,
          completed: false,
          savedScore: 50,
          review: [
            {
              questionId: "q1",
              correct: true,
              explanation: "The first concept is working.",
            },
            {
              questionId: "q2",
              correct: false,
              explanation: "Revisit the second concept before retrying.",
            },
          ],
        }),
      }),
    );

    render(
      <LessonQuiz
        courseTitle="Web Development Foundations"
        courseLessonCount={1}
        completesCourse
        courseSlug="web-development-foundations"
        lessonSlug="semantic-html"
        questions={questions}
        passPercent={75}
        initialCompleted={false}
        initialScore={null}
        initialFeedback={null}
        studentScope="student-1"
      />,
    );

    fireEvent.click(screen.getByLabelText("First answer"));
    fireEvent.click(screen.getByLabelText("Third answer"));
    fireEvent.click(screen.getByRole("button", { name: "Check my answers" }));

    expect(
      await screen.findByRole("heading", {
        name: "Turn the score into a next attempt.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Revisit")).toBeInTheDocument();
    expect(
      screen.getByText("Revisit the second concept before retrying."),
    ).toBeInTheDocument();
    expect(screen.getByText(/50% is saved/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Review quiz attempts" }),
    ).toHaveAttribute(
      "href",
      "/courses/web-development-foundations/quiz-history",
    );
    expect(screen.getByLabelText("First answer")).toBeChecked();
    expect(screen.getByLabelText("Third answer")).toBeChecked();
    expect(
      window.localStorage.getItem(
        "lovable-original:private-lesson-quiz:v1:student-1:web-development-foundations:semantic-html",
      ),
    ).toBeNull();

    fireEvent.click(screen.getByLabelText("Fourth answer"));

    expect(
      screen.queryByRole("heading", {
        name: "Turn the score into a next attempt.",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Check my answers" }),
    ).toBeEnabled();
    await waitFor(() =>
      expect(
        window.localStorage.getItem(
          "lovable-original:private-lesson-quiz:v1:student-1:web-development-foundations:semantic-html",
        ),
      ).not.toBeNull(),
    );
  });
});

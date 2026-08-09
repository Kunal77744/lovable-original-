import type { JavaScriptLabSlug } from "./javascript-lab-progress";

type ReadinessOption = {
  id: string;
  label: string;
};

export type JavaScriptReadinessQuestion = {
  id: string;
  concept: string;
  prompt: string;
  code?: string;
  options: readonly ReadinessOption[];
  correctOptionId: string;
  recommendedLabSlug: JavaScriptLabSlug;
};

export const JAVASCRIPT_READINESS_QUESTIONS: readonly JavaScriptReadinessQuestion[] = [
  {
    id: "parse-input",
    concept: "Input and output",
    prompt: "The judge sends the text 4 7. What should solve(input) do first?",
    options: [
      { id: "split-numbers", label: "Split the text and convert both values to numbers" },
      { id: "add-text", label: "Add the two text characters directly" },
      { id: "read-dom", label: "Read the values from the page DOM" },
    ],
    correctOptionId: "split-numbers",
    recommendedLabSlug: "foundations",
  },
  {
    id: "trace-values",
    concept: "Code tracing",
    prompt: "What value is returned?",
    code: "let total = 2;\ntotal += 3;\ntotal *= 2;\nreturn total;",
    options: [
      { id: "seven", label: "7" },
      { id: "ten", label: "10" },
      { id: "twelve", label: "12" },
    ],
    correctOptionId: "ten",
    recommendedLabSlug: "tracing",
  },
  {
    id: "repair-loop",
    concept: "Debugging",
    prompt: "A loop should visit every item, but it misses the last one. Which condition repairs it?",
    code: "for (let index = 0; index < values.length - 1; index += 1)",
    options: [
      { id: "less-than-length", label: "index < values.length" },
      { id: "less-equal-length", label: "index <= values.length" },
      { id: "start-one", label: "Start index at 1" },
    ],
    correctOptionId: "less-than-length",
    recommendedLabSlug: "debugging",
  },
  {
    id: "choose-edge-case",
    concept: "Test design",
    prompt: "Which input best exposes code that wrongly starts a largest-value search at 0?",
    options: [
      { id: "positive", label: "[2, 8, 5]" },
      { id: "mixed", label: "[-3, 4, -1]" },
      { id: "negative", label: "[-8, -2, -5]" },
    ],
    correctOptionId: "negative",
    recommendedLabSlug: "test-design",
  },
  {
    id: "choose-structure",
    concept: "Data structures",
    prompt: "You need to test whether a username has already appeared. Which structure fits best?",
    options: [
      { id: "set", label: "A Set" },
      { id: "string", label: "One long string" },
      { id: "number", label: "A number counter" },
    ],
    correctOptionId: "set",
    recommendedLabSlug: "data-structures",
  },
  {
    id: "local-scope",
    concept: "Functions and scope",
    prompt: "Where can a variable declared with let inside a function be used?",
    options: [
      { id: "inside-function", label: "Inside that function's scope" },
      { id: "everywhere", label: "Anywhere in the program" },
      { id: "html-only", label: "Only inside an HTML script tag" },
    ],
    correctOptionId: "inside-function",
    recommendedLabSlug: "functions",
  },
];

export const JAVASCRIPT_READINESS_STRETCH_LAB: JavaScriptLabSlug =
  "algorithm-patterns";

export type JavaScriptReadinessAnswer = {
  questionId: string;
  optionId: string;
};

export type JavaScriptReadinessGrade = {
  correctCount: number;
  totalCount: number;
  recommendedLabSlug: JavaScriptLabSlug;
};

export function gradeJavaScriptReadiness(
  answers: readonly JavaScriptReadinessAnswer[],
): JavaScriptReadinessGrade | null {
  if (answers.length !== JAVASCRIPT_READINESS_QUESTIONS.length) return null;

  const answerMap = new Map<string, string>();
  for (const answer of answers) {
    if (answerMap.has(answer.questionId)) return null;
    const question = JAVASCRIPT_READINESS_QUESTIONS.find(
      (candidate) => candidate.id === answer.questionId,
    );
    if (!question?.options.some((option) => option.id === answer.optionId)) {
      return null;
    }
    answerMap.set(answer.questionId, answer.optionId);
  }

  const firstWeakQuestion = JAVASCRIPT_READINESS_QUESTIONS.find(
    (question) => answerMap.get(question.id) !== question.correctOptionId,
  );
  const correctCount = JAVASCRIPT_READINESS_QUESTIONS.filter(
    (question) => answerMap.get(question.id) === question.correctOptionId,
  ).length;

  return {
    correctCount,
    totalCount: JAVASCRIPT_READINESS_QUESTIONS.length,
    recommendedLabSlug:
      firstWeakQuestion?.recommendedLabSlug ?? JAVASCRIPT_READINESS_STRETCH_LAB,
  };
}

export function getJavaScriptReadinessRecommendation(
  labSlug: JavaScriptLabSlug,
) {
  if (labSlug === JAVASCRIPT_READINESS_STRETCH_LAB) {
    return {
      concept: "Reusable problem-solving patterns",
      title: "Continue with algorithm patterns",
      reason:
        "You passed every core check. Practice frequency maps, two pointers, sliding windows, and prefix sums next.",
    };
  }

  const question = JAVASCRIPT_READINESS_QUESTIONS.find(
    (candidate) => candidate.recommendedLabSlug === labSlug,
  );
  return question
    ? {
        concept: question.concept,
        title: `Strengthen ${question.concept.toLowerCase()}`,
        reason:
          "This was the first concept that needs another pass. The recommended lab starts with a short, deterministic exercise.",
      }
    : null;
}

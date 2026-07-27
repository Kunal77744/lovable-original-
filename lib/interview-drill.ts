export const JAVASCRIPT_INTERVIEW_DRILL = {
  slug: "javascript-fundamentals",
  title: "JavaScript fundamentals",
  description:
    "Five short prompts for explaining the JavaScript ideas interviewers ask about most.",
  estimatedMinutes: 10,
  questions: [
    {
      slug: "const-let-var",
      eyebrow: "Bindings and scope",
      prompt:
        "When would you use const, let, or var, and what mistake does const not prevent?",
      rubric: [
        "const prevents reassignment of the binding, not mutation inside an object or array.",
        "let is block-scoped and fits a value that must be reassigned.",
        "var is function-scoped and hoisted, so modern code usually avoids it.",
      ],
    },
    {
      slug: "strict-equality",
      eyebrow: "Values and coercion",
      prompt:
        "What is the difference between == and ===, and which one would you choose by default?",
      rubric: [
        "== can coerce values before comparing them.",
        "=== compares type and value without coercion.",
        "Strict equality is the safer default; any coercion should be deliberate.",
      ],
    },
    {
      slug: "closures",
      eyebrow: "Functions and memory",
      prompt:
        "Explain a closure in plain language and give one practical use for it.",
      rubric: [
        "An inner function keeps access to variables from the scope where it was created.",
        "That access remains even after the outer function has returned.",
        "A useful example could be private state, a factory, or an event handler.",
      ],
    },
    {
      slug: "async-order",
      eyebrow: "The event loop",
      prompt:
        "Why can a resolved Promise callback run before a setTimeout callback scheduled for 0 ms?",
      rubric: [
        "Synchronous code finishes before queued callbacks run.",
        "Promise callbacks enter the microtask queue.",
        "Microtasks are drained before the next task, where setTimeout callbacks wait.",
      ],
    },
    {
      slug: "array-transformations",
      eyebrow: "Working with collections",
      prompt:
        "How do map, filter, and reduce differ, and when can reduce make code harder to read?",
      rubric: [
        "map transforms each item and keeps the collection length.",
        "filter keeps only items that pass a test.",
        "reduce combines items into one accumulated result, but can hide intent when a simpler method fits.",
      ],
    },
  ],
} as const;

export const INTERVIEW_SELF_RATINGS = [
  {
    value: "needs-work",
    label: "Needs another pass",
    shortLabel: "Needs work",
  },
  {
    value: "almost",
    label: "Nearly there",
    shortLabel: "Nearly there",
  },
  {
    value: "ready",
    label: "Ready to explain",
    shortLabel: "Ready",
  },
] as const;

export type InterviewSelfRating =
  (typeof INTERVIEW_SELF_RATINGS)[number]["value"];

export type InterviewAnswer = {
  questionSlug: string;
  answer: string;
  rating: InterviewSelfRating;
};

export type InterviewDrillProgress = {
  status: "not-started" | "in-progress" | "completed";
  currentQuestion: number;
  answers: InterviewAnswer[];
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string | null;
};

export const EMPTY_INTERVIEW_DRILL_PROGRESS: InterviewDrillProgress = {
  status: "not-started",
  currentQuestion: 0,
  answers: [],
  startedAt: null,
  completedAt: null,
  updatedAt: null,
};

const validQuestionSlugs = new Set<string>(
  JAVASCRIPT_INTERVIEW_DRILL.questions.map((question) => question.slug),
);
const validRatings = new Set<InterviewSelfRating>(
  INTERVIEW_SELF_RATINGS.map((rating) => rating.value),
);

export function validateInterviewDrillRequest(payload: unknown):
  | { valid: true; action: "start" }
  | {
      valid: true;
      action: "save-answer";
      questionSlug: string;
      answer: string;
      rating: InterviewSelfRating;
    }
  | { valid: false; error: string } {
  if (!payload || typeof payload !== "object") {
    return { valid: false, error: "We couldn’t read that response." };
  }

  const record = payload as Record<string, unknown>;

  if (record.action === "start") {
    return { valid: true, action: "start" };
  }

  if (record.action !== "save-answer") {
    return { valid: false, error: "Choose a valid drill action." };
  }

  if (
    typeof record.questionSlug !== "string" ||
    !validQuestionSlugs.has(record.questionSlug)
  ) {
    return { valid: false, error: "Choose a valid interview question." };
  }

  if (typeof record.answer !== "string" || !record.answer.trim()) {
    return {
      valid: false,
      error: "Write an answer before saving this question.",
    };
  }

  if (record.answer.length > 2000) {
    return {
      valid: false,
      error: "Keep your answer to 2,000 characters or fewer.",
    };
  }

  if (
    typeof record.rating !== "string" ||
    !validRatings.has(record.rating as InterviewSelfRating)
  ) {
    return {
      valid: false,
      error: "Compare your answer with the rubric and choose one rating.",
    };
  }

  return {
    valid: true,
    action: "save-answer",
    questionSlug: record.questionSlug,
    answer: record.answer,
    rating: record.rating as InterviewSelfRating,
  };
}

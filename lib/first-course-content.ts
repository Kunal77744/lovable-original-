export const FIRST_COURSE = {
  id: "web-development-foundations",
  slug: "web-development-foundations",
  title: "Web Development Foundations",
  description:
    "Build the browser-first skills behind accessible, job-ready interfaces.",
  status: "live",
} as const;

export const FIRST_LESSON = {
  id: "web-development-foundations-semantic-html",
  slug: "semantic-html",
  title: "Build a page the browser understands",
  description:
    "Use semantic HTML to turn a blank document into an accessible article page.",
  moduleTitle: "Module 1 · HTML foundations",
  position: 1,
  estimatedMinutes: 18,
} as const;

export type QuizChoice = {
  id: string;
  label: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  choices: readonly QuizChoice[];
};

type GradedQuizQuestion = QuizQuestion & {
  correctChoiceId: string;
  explanation: string;
};

export const FIRST_LESSON_QUIZ: readonly GradedQuizQuestion[] = [
  {
    id: "main-landmark",
    prompt:
      "Which element should wrap the unique, primary content of this article page?",
    choices: [
      { id: "div", label: "<div>" },
      { id: "main", label: "<main>" },
      { id: "section", label: "<section>" },
    ],
    correctChoiceId: "main",
    explanation:
      "<main> identifies the page’s unique primary content for browsers and assistive technology.",
  },
  {
    id: "heading-order",
    prompt:
      "The page title is an <h1>. What is the clearest heading level for its direct sections?",
    choices: [
      { id: "h2", label: "<h2>" },
      { id: "h4", label: "<h4>" },
      { id: "strong", label: "<strong>" },
    ],
    correctChoiceId: "h2",
    explanation:
      "<h2> creates a logical child level beneath the page’s <h1>; heading levels describe structure, not visual size.",
  },
  {
    id: "article-choice",
    prompt:
      "When is <article> a better choice than a generic <div>?",
    choices: [
      {
        id: "standalone",
        label: "When the content can stand on its own or be reused independently",
      },
      {
        id: "green",
        label: "When the content needs a green background",
      },
      {
        id: "layout",
        label: "Whenever CSS Grid is used",
      },
    ],
    correctChoiceId: "standalone",
    explanation:
      "<article> communicates that a block is independently meaningful, such as a post, story, or product review.",
  },
  {
    id: "semantic-benefit",
    prompt: "What is the strongest reason to prefer semantic HTML?",
    choices: [
      {
        id: "meaning",
        label:
          "It gives content useful meaning before visual styling or JavaScript runs",
      },
      {
        id: "shorter",
        label: "It always produces fewer lines of code",
      },
      {
        id: "framework",
        label: "It is required only when using React",
      },
    ],
    correctChoiceId: "meaning",
    explanation:
      "Semantic elements expose a meaningful structure to browsers, search engines, keyboards, and assistive technology.",
  },
] as const;

export const FIRST_LESSON_PASS_PERCENT = 75;

export type QuizAnswers = Record<string, string>;

export function gradeFirstLessonQuiz(answers: QuizAnswers) {
  const answeredQuestionIds = Object.keys(answers);
  const knownQuestionIds = new Set(
    FIRST_LESSON_QUIZ.map((question) => question.id),
  );

  if (
    answeredQuestionIds.length !== FIRST_LESSON_QUIZ.length ||
    answeredQuestionIds.some((questionId) => !knownQuestionIds.has(questionId))
  ) {
    return {
      valid: false as const,
      error: "Answer every question before checking your work.",
    };
  }

  const correctCount = FIRST_LESSON_QUIZ.filter(
    (question) => answers[question.id] === question.correctChoiceId,
  ).length;
  const score = Math.round((correctCount / FIRST_LESSON_QUIZ.length) * 100);

  return {
    valid: true as const,
    score,
    passed: score >= FIRST_LESSON_PASS_PERCENT,
    correctCount,
    totalCount: FIRST_LESSON_QUIZ.length,
  };
}

export function getPublicFirstLessonQuiz(): readonly QuizQuestion[] {
  return FIRST_LESSON_QUIZ.map(({ id, prompt, choices }) => ({
    id,
    prompt,
    choices,
  }));
}
